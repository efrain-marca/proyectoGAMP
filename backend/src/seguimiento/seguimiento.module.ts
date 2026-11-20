import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { AvanceFinanciero } from '../avances-financieros/avance-financiero.entity';
import { AvanceFisico } from '../avances-fisicos/avance-fisico.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { SeguimientoController } from './seguimiento.controller';
import { SeguimientoService } from './seguimiento.service';
import { Responsable } from '../responsables/responsable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proyecto, Actividad, AvanceFisico, AvanceFinanciero, Usuario, Responsable])],
  controllers: [SeguimientoController], providers: [SeguimientoService],
})
export class SeguimientoModule {}
