import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Actividad } from '../actividades/actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Incidencia } from './incidencia.entity';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incidencia, Proyecto, Actividad, Usuario])],
  controllers: [IncidenciasController],
  providers: [IncidenciasService],
})
export class IncidenciasModule {}
