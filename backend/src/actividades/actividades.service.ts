import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { ActividadDto } from './dto/actividad.dto';
import { ActualizarActividadDto } from './dto/actualizar-actividad.dto';
import { Actividad } from './actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class ActividadesService {
  constructor(@InjectRepository(Actividad) private readonly repo: Repository<Actividad>, @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>, @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>) {}
  findAll(): Promise<Actividad[]> { return this.repo.find({ relations: { proyecto: true }, order: { fechaInicio: 'ASC' } }); }
  async create(dto: ActividadDto): Promise<Actividad> {
    if (dto.fechaFin < dto.fechaInicio) throw new BadRequestException('La fecha de fin debe ser posterior al inicio');
    const proyecto = await this.proyectos.findOneBy({ id: dto.proyectoId });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const { proyectoId, responsableId, ...data } = dto;
    const responsable = responsableId ? await this.usuarios.findOneBy({ id: responsableId }) : null;
    if (responsableId && !responsable) throw new NotFoundException('Responsable no encontrado');
    const actividad = this.repo.create({ ...data, peso: String(dto.peso ?? 0), avance: String(dto.avance ?? 0), proyecto, responsable: responsable ?? undefined });
    return this.repo.save(actividad);
  }
  async update(id: number, dto: ActualizarActividadDto): Promise<Actividad> {
    const actividad = await this.repo.findOneBy({ id });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    const fechaInicio = dto.fechaInicio ?? actividad.fechaInicio;
    const fechaFin = dto.fechaFin ?? actividad.fechaFin;
    if (fechaFin < fechaInicio) throw new BadRequestException('La fecha de fin debe ser posterior al inicio');
    if (dto.proyectoId) {
      const proyecto = await this.proyectos.findOneBy({ id: dto.proyectoId });
      if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
      actividad.proyecto = proyecto;
    }
    const { proyectoId, responsableId, ...data } = dto;
    if (responsableId) {
      const responsable = await this.usuarios.findOneBy({ id: responsableId });
      if (!responsable) throw new NotFoundException('Responsable no encontrado');
      actividad.responsable = responsable;
    }
    Object.assign(actividad, data);
    return this.repo.save(actividad);
  }
  async remove(id: number): Promise<void> {
    const actividad = await this.repo.findOneBy({ id });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    await this.repo.remove(actividad);
  }
}
