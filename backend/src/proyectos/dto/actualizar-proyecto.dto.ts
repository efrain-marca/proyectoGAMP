import { PartialType } from '@nestjs/mapped-types';
import { ProyectoDto } from './proyecto.dto';

export class ActualizarProyectoDto extends PartialType(ProyectoDto) {}
