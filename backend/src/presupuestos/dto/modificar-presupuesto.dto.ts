import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class ModificarPresupuestoDto {
  @IsInt() proyectoId: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) montoNuevo: number;
  @IsString() motivo: string;
}
