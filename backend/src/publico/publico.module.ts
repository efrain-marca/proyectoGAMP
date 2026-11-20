import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Actividad } from '../actividades/actividad.entity';
import { AvanceFisico } from '../avances-fisicos/avance-fisico.entity';
import { AvanceFinanciero } from '../avances-financieros/avance-financiero.entity';
import { Documento } from '../documentos/documento.entity';
import { PublicoController } from './publico.controller';
import { PublicoService } from './publico.service';

@Module({
  imports: [TypeOrmModule.forFeature([Proyecto, Actividad, AvanceFisico, AvanceFinanciero, Documento])],
  controllers: [PublicoController],
  providers: [PublicoService],
})
export class PublicoModule {}
