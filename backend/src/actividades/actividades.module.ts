import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Actividad } from './actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { ActividadesController } from './actividades.controller';
import { ActividadesService } from './actividades.service';

@Module({ imports: [TypeOrmModule.forFeature([Actividad, Proyecto, Usuario])], controllers: [ActividadesController], providers: [ActividadesService] })
export class ActividadesModule {}
