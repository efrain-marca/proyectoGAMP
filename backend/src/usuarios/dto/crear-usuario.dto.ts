import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/roles';

export class CrearUsuarioDto {
  @IsString() @IsNotEmpty() nombre: string;
  @IsEmail() correo: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsEnum(UserRole) rol?: UserRole;
}
