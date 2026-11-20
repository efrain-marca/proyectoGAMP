import { IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CrearAvanceFisicoDto {
  @IsInt() proyectoId: number;
  @IsOptional() @IsInt() actividadId?: number;
  @IsNumber() @Min(0) @Max(100) porcentaje: number;
  @IsOptional() @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/, { message: 'La observación solo puede contener letras y espacios' }) observacion?: string;
  @IsOptional() @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.,;:\s]*$/, { message: 'La descripción contiene caracteres no permitidos' }) descripcionTrabajo?: string;
}
