import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { ModificacionPresupuestaria } from './modificacion-presupuestaria.entity';
import { ModificarPresupuestoDto } from './dto/modificar-presupuesto.dto';

@Injectable()
export class PresupuestosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>,
    @InjectRepository(ModificacionPresupuestaria) private readonly modificaciones: Repository<ModificacionPresupuestaria>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  async findByProject(proyectoId: number) {
    const proyecto = await this.proyectos.findOneBy({ id: proyectoId });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const modificaciones = await this.modificaciones.find({ where: { proyecto: { id: proyectoId } }, relations: { usuario: true, autorizadoPor: true }, order: { createdAt: 'DESC' } });
    return { inicial: Number(proyecto.presupuestoInicial ?? proyecto.presupuesto), vigente: Number(proyecto.presupuesto), modificaciones };
  }

  async modify(dto: ModificarPresupuestoDto, userId: number): Promise<ModificacionPresupuestaria> {
    const proyecto = await this.proyectos.findOneBy({ id: dto.proyectoId });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const usuario = await this.usuarios.findOneBy({ id: userId });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const modification = this.modificaciones.create({
      proyecto,
      usuario,
      montoAnterior: proyecto.presupuesto,
      montoNuevo: String(dto.montoNuevo),
      motivo: dto.motivo,
      autorizadoPor: null,
    });
    return this.modificaciones.save(modification);
  }

  async approve(id: number, userId: number): Promise<ModificacionPresupuestaria> {
    const modification = await this.modificaciones.findOne({ where: { id }, relations: { proyecto: true } });
    if (!modification) throw new NotFoundException('Modificación no encontrada');
    const usuario = await this.usuarios.findOneBy({ id: userId });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    modification.autorizadoPor = usuario;
    modification.proyecto.presupuesto = modification.montoNuevo;
    await this.proyectos.save(modification.proyecto);
    return this.modificaciones.save(modification);
  }
}
