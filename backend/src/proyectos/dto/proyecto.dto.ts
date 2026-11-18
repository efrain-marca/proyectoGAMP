import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { EstadoProyecto } from '../proyecto.entity';

export class ProyectoDto {
  @IsString() @MinLength(2) codigo: string;
  @IsString() @MinLength(2) nombre: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsString() ubicacion: string;
  @IsDateString() fechaInicio: string;
  @IsDateString() fechaFin: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) presupuesto: number;
  @IsOptional() @IsEnum(EstadoProyecto) estado?: EstadoProyecto;
}
