import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Actividad } from '../actividades/actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Documento } from './documento.entity';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Documento, Proyecto, Actividad, Usuario])],
  controllers: [DocumentosController],
  providers: [DocumentosService],
})
export class DocumentosModule {}
