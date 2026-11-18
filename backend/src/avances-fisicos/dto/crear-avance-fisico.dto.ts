import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CrearAvanceFisicoDto {
  @IsInt() proyectoId: number;
  @IsOptional() @IsInt() actividadId?: number;
  @IsNumber() @Min(0) @Max(100) porcentaje: number;
  @IsOptional() @IsString() observacion?: string;
}
