import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class ActividadDto {
  @IsString() @MinLength(2) nombre: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsDateString() fechaInicio: string;
  @IsDateString() fechaFin: string;
  @IsInt() proyectoId: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) avance?: number;
}
