import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { PresupuestosService } from './presupuestos.service';
import { ModificarPresupuestoDto } from './dto/modificar-presupuesto.dto';

@Controller('presupuestos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PresupuestosController {
  constructor(private readonly service: PresupuestosService) {}
  @Get('proyecto/:id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) findByProject(@Param('id', ParseIntPipe) id: number) { return this.service.findByProject(id); }
  @Post('modificar') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) modify(@Body() dto: ModificarPresupuestoDto, @Req() req: { user: { id: number } }) { return this.service.modify(dto, req.user.id); }
  @Patch(':id/aprobar') @Roles(UserRole.ADMINISTRADOR) approve(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { id: number } }) { return this.service.approve(id, req.user.id); }
}
