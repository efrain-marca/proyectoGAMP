import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto';
import { ProyectoDto } from './dto/proyecto.dto';
import { Proyecto } from './proyecto.entity';
import { Responsable } from '../responsables/responsable.entity';
import { UserRole } from '../common/roles';

@Injectable()
export class ProyectosService {
  constructor(@InjectRepository(Proyecto) private readonly repo: Repository<Proyecto>, @InjectRepository(Responsable) private readonly responsables: Repository<Responsable>) {}
  async findAll(userId: number, role: UserRole): Promise<Proyecto[]> {
    if (role === UserRole.ADMINISTRADOR || role === UserRole.SUPERVISOR) return this.repo.find({ order: { updatedAt: 'DESC' } });
    const assignments = await this.responsables.find({ where: { usuario: { id: userId }, activo: true }, relations: { proyecto: true } });
    const ids = [...new Set(assignments.map((assignment) => assignment.proyecto.id))];
    if (!ids.length) return [];
    return this.repo.findByIds(ids);
  }
  async findOne(id: number): Promise<Proyecto> {
    const project = await this.repo.findOne({ where: { id }, relations: { actividades: true, presupuestos: true, responsables: true } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }
  async findOneForUser(id: number, userId: number, role: UserRole): Promise<Proyecto> {
    if (role !== UserRole.ADMINISTRADOR && role !== UserRole.SUPERVISOR) {
      const assigned = await this.responsables.exists({ where: { proyecto: { id }, usuario: { id: userId }, activo: true } });
      if (!assigned) throw new ForbiddenException('No tiene asignado este proyecto');
    }
    return this.findOne(id);
  }
  async create(dto: ProyectoDto): Promise<Proyecto> {
    if (dto.fechaFin < dto.fechaInicio) throw new BadRequestException('La fecha de fin debe ser posterior al inicio');
    if (await this.repo.existsBy({ codigo: dto.codigo })) throw new ConflictException('El código del proyecto ya existe');
    const { presupuesto, latitud, longitud, ...data } = dto;
    return this.repo.save(this.repo.create({
      ...data,
      presupuesto: String(presupuesto),
      presupuestoInicial: String(presupuesto),
      latitud: typeof latitud === 'number' ? String(latitud) : null,
      longitud: typeof longitud === 'number' ? String(longitud) : null,
    }));
  }
  async update(id: number, dto: ActualizarProyectoDto): Promise<Proyecto> {
    const project = await this.findOne(id);
    if (dto.codigo && dto.codigo !== project.codigo && await this.repo.existsBy({ codigo: dto.codigo })) throw new ConflictException('El código del proyecto ya existe');
    const fechaInicio = dto.fechaInicio ?? project.fechaInicio;
    const fechaFin = dto.fechaFin ?? project.fechaFin;
    if (new Date(fechaFin) < new Date(fechaInicio)) throw new BadRequestException('La fecha de fin debe ser posterior al inicio');
    const { presupuesto, latitud, longitud, ...fields } = dto;
    Object.assign(project, fields);
    if (presupuesto !== undefined) project.presupuesto = String(presupuesto);
    if (typeof latitud === 'number') project.latitud = String(latitud);
    if (typeof longitud === 'number') project.longitud = String(longitud);
    return this.repo.save(project);
  }
  async remove(id: number): Promise<void> { await this.repo.remove(await this.findOne(id)); }
}
