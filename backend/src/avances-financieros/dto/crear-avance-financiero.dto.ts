import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearAvanceFinancieroDto {
  @IsInt() proyectoId: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) monto: number;
  @IsOptional() @IsString() referencia?: string;
  @IsOptional() @IsString() observacion?: string;
}
