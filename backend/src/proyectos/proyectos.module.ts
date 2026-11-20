import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './proyecto.entity';
import { Responsable } from '../responsables/responsable.entity';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';

@Module({ imports: [TypeOrmModule.forFeature([Proyecto, Responsable])], controllers: [ProyectosController], providers: [ProyectosService], exports: [ProyectosService] })
export class ProyectosModule {}
