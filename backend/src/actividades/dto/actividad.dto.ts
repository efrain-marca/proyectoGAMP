import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';

export class ActividadDto {
  @IsString() @MinLength(2) @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' }) nombre: string;
  @IsOptional() @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/, { message: 'La descripción solo puede contener letras y espacios' }) descripcion?: string;
  @IsDateString() fechaInicio: string;
  @IsDateString() fechaFin: string;
  @IsInt() proyectoId: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) avance?: number;
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) peso?: number;
  @IsOptional() @IsString() prioridad?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  @IsOptional() @IsString() estado?: 'PENDIENTE' | 'EN_EJECUCION' | 'FINALIZADA' | 'SUSPENDIDA';
  @IsOptional() @IsInt() responsableId?: number;
}
