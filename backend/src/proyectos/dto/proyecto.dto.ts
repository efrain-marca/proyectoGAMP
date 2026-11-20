import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import { EstadoProyecto } from '../proyecto.entity';

export class ProyectoDto {
  @IsString() @MinLength(2) @Matches(/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]+$/, { message: 'El código solo puede contener letras, números, guiones y guiones bajos' }) codigo: string;
  @IsString() @MinLength(2) @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' }) nombre: string;
  @IsOptional() @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/, { message: 'La descripción solo puede contener letras y espacios' }) descripcion?: string;
  @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, { message: 'La ubicación solo puede contener letras y espacios' }) ubicacion: string;
  @IsOptional() @IsString() tipoProyecto?: string;
  @IsOptional() @IsString() distrito?: string;
  @IsOptional() @IsString() comunidad?: string;
  @IsOptional() @IsString() unidadOrganizacional?: string;
  @IsOptional() @IsString() modalidad?: string;
  @IsOptional() @IsNumber() latitud?: number;
  @IsOptional() @IsNumber() longitud?: number;
  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @IsBoolean() publicado?: boolean;
  @IsOptional() @IsBoolean() publicarFinanciero?: boolean;
  @IsDateString() fechaInicio: string;
  @IsDateString() fechaFin: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) presupuesto: number;
  @IsOptional() @IsEnum(EstadoProyecto) estado?: EstadoProyecto;
}
