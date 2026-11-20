import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { EstadoIncidencia, PrioridadIncidencia } from '../incidencia.entity';

export class IncidenciaDto {
  @IsInt() proyectoId: number;
  @IsOptional() @IsInt() actividadId?: number;
  @IsString() @MinLength(3) @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,-]+$/, { message: 'El título contiene caracteres no permitidos' }) titulo: string;
  @IsString() @MinLength(3) descripcion: string;
  @IsOptional() @IsEnum(PrioridadIncidencia) prioridad?: PrioridadIncidencia;
  @IsOptional() @IsEnum(EstadoIncidencia) estado?: EstadoIncidencia;
  @IsOptional() @IsDateString() fechaPrevistaSolucion?: string;
  @IsOptional() @IsInt() responsableAtencionId?: number;
  @IsOptional() @IsString() solucionAplicada?: string;
}
