import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { CrearAvanceFinancieroDto } from '../avances-financieros/dto/crear-avance-financiero.dto';
import { CrearAvanceFisicoDto } from '../avances-fisicos/dto/crear-avance-fisico.dto';
import { SeguimientoService } from './seguimiento.service';

interface AuthenticatedRequest { user: { id: number; role: UserRole } }

@Controller() @UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoController {
  constructor(private readonly service: SeguimientoService) {}
  @Get('avances-fisicos') listPhysical() { return this.service.listPhysical(); }
  @Post('avances-fisicos') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO) addPhysical(@Body() dto: CrearAvanceFisicoDto, @Req() req: AuthenticatedRequest) { return this.service.addPhysical(dto, req.user.id); }
  @Get('avances-financieros') listFinancial() { return this.service.listFinancial(); }
  @Post('avances-financieros') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO) addFinancial(@Body() dto: CrearAvanceFinancieroDto, @Req() req: AuthenticatedRequest) { return this.service.addFinancial(dto, req.user.id, req.user.role); }
  @Get('alertas') alerts() { return this.service.alerts(); }
  @Get('reportes/proyectos') report() { return this.service.projectReport(); }
  @Get('avances-fisicos/pendientes') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) pendingPhysical() { return this.service.pendingPhysical(); }
  @Patch('avances-fisicos/:id/aprobar') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) approvePhysical(@Param('id', ParseIntPipe) id: number) { return this.service.approvePhysical(id); }
  @Patch('avances-fisicos/:id/observar') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) observePhysical(@Param('id', ParseIntPipe) id: number, @Body() dto: { observacion: string }) { return this.service.observePhysical(id, dto.observacion); }
  @Get('dashboard') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) dashboard() { return this.service.dashboard(); }
}
