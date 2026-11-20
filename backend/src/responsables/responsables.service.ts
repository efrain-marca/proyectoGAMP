import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Responsable } from './responsable.entity';
import { AsignarResponsableDto } from './dto/asignar-responsable.dto';

@Injectable()
export class ResponsablesService {
  constructor(
    @InjectRepository(Responsable) private readonly repo: Repository<Responsable>,
    @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  listAll(): Promise<Responsable[]> {
    return this.repo.find({ relations: { proyecto: true, usuario: true, asignadoPor: true }, order: { createdAt: 'DESC' } });
  }

  async myProjects(usuarioId: number): Promise<Responsable[]> {
    return this.repo.find({ where: { usuario: { id: usuarioId }, activo: true }, relations: { proyecto: true, usuario: true }, order: { fechaAsignacion: 'DESC' } });
  }

  async assign(dto: AsignarResponsableDto, asignadoPorId: number): Promise<Responsable> {
    if (dto.fechaFinalizacion && dto.fechaFinalizacion < dto.fechaAsignacion) {
      throw new BadRequestException('La fecha de finalización no puede ser anterior a la asignación');
    }
    const [proyecto, usuario, asignadoPor] = await Promise.all([
      this.proyectos.findOneBy({ id: dto.proyectoId }),
      this.usuarios.findOneBy({ id: dto.usuarioId }),
      this.usuarios.findOneBy({ id: asignadoPorId }),
    ]);
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const existente = await this.repo.findOne({ where: { proyecto: { id: dto.proyectoId }, usuario: { id: dto.usuarioId }, activo: true } });
    if (existente) throw new BadRequestException('El usuario ya está asignado activamente a este proyecto');
    return this.repo.save(this.repo.create({
      proyecto,
      usuario,
      asignadoPor: asignadoPor ?? null,
      nombre: usuario.nombre,
      cargo: dto.funcion,
      unidad: proyecto.unidadOrganizacional ?? undefined,
      fechaAsignacion: dto.fechaAsignacion,
      fechaFinalizacion: dto.fechaFinalizacion ?? null,
      activo: dto.activo ?? true,
      observaciones: dto.observaciones ?? null,
    }));
  }

  async finalize(id: number): Promise<Responsable> {
    const assignment = await this.repo.findOne({ where: { id }, relations: { proyecto: true, usuario: true } });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    assignment.activo = false;
    assignment.fechaFinalizacion = new Date().toISOString().slice(0, 10);
    return this.repo.save(assignment);
  }

  async isAssigned(usuarioId: number, proyectoId: number): Promise<boolean> {
    return this.repo.exists({ where: { usuario: { id: usuarioId }, proyecto: { id: proyectoId }, activo: true } });
  }
}
