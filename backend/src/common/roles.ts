import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  SUPERVISOR = 'SUPERVISOR',
  TECNICO = 'TECNICO',
  CONSULTA = 'CONSULTA',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
