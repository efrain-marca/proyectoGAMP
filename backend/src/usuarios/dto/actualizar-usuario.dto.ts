import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/roles';

export class ActualizarUsuarioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsEmail() correo?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsEnum(UserRole) rol?: UserRole;
  @IsOptional() @IsBoolean() activo?: boolean;
}
