import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class AsignarResponsableDto {
  @IsInt() proyectoId: number;
  @IsInt() usuarioId: number;
  @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, { message: 'La función solo puede contener letras y espacios' }) funcion: string;
  @IsDateString() fechaAsignacion: string;
  @IsOptional() @IsDateString() fechaFinalizacion?: string;
  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}
