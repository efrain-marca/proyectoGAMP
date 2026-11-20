import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trazabilidad } from './trazabilidad.entity';
import { TrazabilidadController } from './trazabilidad.controller';
import { TrazabilidadService } from './trazabilidad.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trazabilidad])],
  controllers: [TrazabilidadController],
  providers: [TrazabilidadService],
})
export class TrazabilidadModule {}
