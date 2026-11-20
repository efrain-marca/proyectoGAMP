import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Actividad } from '../actividades/actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Incidencia } from './incidencia.entity';
import { IncidenciaDto } from './dto/incidencia.dto';

@Injectable()
export class IncidenciasService {
  constructor(
    @InjectRepository(Incidencia) private readonly repo: Repository<Incidencia>,
    @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>,
    @InjectRepository(Actividad) private readonly actividades: Repository<Actividad>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  findAll(): Promise<Incidencia[]> { return this.repo.find({ relations: { proyecto: true, actividad: true, usuario: true, responsableAtencion: true }, order: { createdAt: 'DESC' } }); }

  async create(dto: IncidenciaDto, userId: number): Promise<Incidencia> {
    const proyecto = await this.proyectos.findOneBy({ id: dto.proyectoId });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const usuario = await this.usuarios.findOneBy({ id: userId });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    let actividad: Actividad | null = null;
    if (dto.actividadId) {
      actividad = await this.actividades.findOne({ where: { id: dto.actividadId }, relations: { proyecto: true } });
      if (!actividad || actividad.proyecto.id !== proyecto.id) throw new BadRequestException('La actividad no pertenece al proyecto');
    }
    let responsableAtencion: Usuario | null = null;
    if (dto.responsableAtencionId) {
      responsableAtencion = await this.usuarios.findOneBy({ id: dto.responsableAtencionId });
      if (!responsableAtencion) throw new NotFoundException('Responsable de atención no encontrado');
    }
    const entity = this.repo.create({
      proyecto, actividad, usuario, responsableAtencion,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      prioridad: dto.prioridad,
      estado: dto.estado,
      fechaPrevistaSolucion: dto.fechaPrevistaSolucion ?? null,
      solucionAplicada: dto.solucionAplicada ?? null,
      codigo: `INC-${Date.now().toString().slice(-8)}`,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: Partial<IncidenciaDto>): Promise<Incidencia> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Incidencia no encontrada');
    if (dto.estado) entity.estado = dto.estado;
    if (dto.prioridad) entity.prioridad = dto.prioridad;
    if (dto.descripcion) entity.descripcion = dto.descripcion;
    if (dto.titulo) entity.titulo = dto.titulo;
    if (dto.solucionAplicada !== undefined) entity.solucionAplicada = dto.solucionAplicada;
    if (dto.fechaPrevistaSolucion !== undefined) entity.fechaPrevistaSolucion = dto.fechaPrevistaSolucion;
    return this.repo.save(entity);
  }
}
