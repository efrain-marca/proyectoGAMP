import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../common/roles';

export class CrearUsuarioDto {
  @IsString() @IsNotEmpty() @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' }) nombre: string;
  @IsEmail() correo: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsEnum(UserRole) rol?: UserRole;
}
