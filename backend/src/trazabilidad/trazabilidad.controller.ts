import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { TrazabilidadService } from './trazabilidad.service';

@Controller('trazabilidad')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrazabilidadController {
  constructor(private readonly service: TrazabilidadService) {}
  @Get() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) findAll() { return this.service.findAll(); }
}
