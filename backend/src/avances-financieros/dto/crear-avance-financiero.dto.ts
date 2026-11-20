import { IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CrearAvanceFinancieroDto {
  @IsInt() proyectoId: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) monto: number;
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]*$/, { message: 'La referencia solo puede contener letras, números, guiones y guiones bajos' }) referencia?: string;
  @IsOptional() @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/, { message: 'La observación solo puede contener letras y espacios' }) observacion?: string;
}
