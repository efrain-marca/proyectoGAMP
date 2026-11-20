import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../common/roles';

export class ActualizarUsuarioDto {
  @IsOptional() @IsString() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' }) nombre?: string;
  @IsOptional() @IsEmail() correo?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsEnum(UserRole) rol?: UserRole;
  @IsOptional() @IsBoolean() activo?: boolean;
}
