import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto';
import { ProyectoDto } from './dto/proyecto.dto';
import { Proyecto } from './proyecto.entity';

@Injectable()
export class ProyectosService {
  constructor(@InjectRepository(Proyecto) private readonly repo: Repository<Proyecto>) {}
  findAll(): Promise<Proyecto[]> { return this.repo.find({ order: { updatedAt: 'DESC' } }); }
  async findOne(id: number): Promise<Proyecto> {
    const project = await this.repo.findOne({ where: { id }, relations: { actividades: true, presupuestos: true, responsables: true } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }
  async create(dto: ProyectoDto): Promise<Proyecto> {
    if (dto.fechaFin < dto.fechaInicio) throw new BadRequestException('La fecha de fin debe ser posterior al inicio');
    if (await this.repo.existsBy({ codigo: dto.codigo })) throw new ConflictException('El código del proyecto ya existe');
    const { presupuesto, ...data } = dto;
    return this.repo.save(this.repo.create({ ...data, presupuesto: String(presupuesto) }));
  }
  async update(id: number, dto: ActualizarProyectoDto): Promise<Proyecto> {
    const project = await this.findOne(id);
    if (dto.codigo && dto.codigo !== project.codigo && await this.repo.existsBy({ codigo: dto.codigo })) throw new ConflictException('El código del proyecto ya existe');
    if (dto.fechaInicio && dto.fechaFin && dto.fechaFin < dto.fechaInicio) throw new BadRequestException('Rango de fechas inválido');
    const { presupuesto, ...fields } = dto;
    Object.assign(project, fields);
    if (presupuesto !== undefined) project.presupuesto = String(presupuesto);
    return this.repo.save(project);
  }
  async remove(id: number): Promise<void> { await this.repo.remove(await this.findOne(id)); }
}
