import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Responsable } from './responsable.entity';
import { ResponsablesController } from './responsables.controller';
import { ResponsablesService } from './responsables.service';

@Module({
  imports: [TypeOrmModule.forFeature([Responsable, Proyecto, Usuario])],
  controllers: [ResponsablesController],
  providers: [ResponsablesService],
  exports: [ResponsablesService],
})
export class ResponsablesModule {}
