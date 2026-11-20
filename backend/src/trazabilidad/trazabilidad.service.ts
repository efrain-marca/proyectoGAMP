import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trazabilidad } from './trazabilidad.entity';

@Injectable()
export class TrazabilidadService {
  constructor(@InjectRepository(Trazabilidad) private readonly repo: Repository<Trazabilidad>) {}
  findAll(): Promise<Trazabilidad[]> {
    return this.repo.find({ relations: { usuario: true }, order: { fechaHora: 'DESC' }, take: 500 });
  }
}
