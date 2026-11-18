import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { ActividadDto } from './dto/actividad.dto';
import { ActualizarActividadDto } from './dto/actualizar-actividad.dto';
import { Actividad } from './actividad.entity';

@Injectable()
export class ActividadesService {
  constructor(@InjectRepository(Actividad) private readonly repo: Repository<Actividad>, @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>) {}
  findAll(): Promise<Actividad[]> { return this.repo.find({ relations: { proyecto: true }, order: { fechaInicio: 'ASC' } }); }
  async create(dto: ActividadDto): Promise<Actividad> {
    const proyecto = await this.proyectos.findOneBy({ id: dto.proyectoId });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const { proyectoId, ...data } = dto;
    const actividad = this.repo.create({ ...data, avance: String(dto.avance ?? 0), proyecto });
    return this.repo.save(actividad);
  }
  async update(id: number, dto: ActualizarActividadDto): Promise<Actividad> {
    const actividad = await this.repo.findOneBy({ id });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    if (dto.proyectoId) {
      const proyecto = await this.proyectos.findOneBy({ id: dto.proyectoId });
      if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
      actividad.proyecto = proyecto;
    }
    const { proyectoId, ...data } = dto;
    Object.assign(actividad, data);
    return this.repo.save(actividad);
  }
  async remove(id: number): Promise<void> {
    const actividad = await this.repo.findOneBy({ id });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    await this.repo.remove(actividad);
  }
}
