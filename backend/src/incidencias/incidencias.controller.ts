import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { IncidenciasService } from './incidencias.service';
import { IncidenciaDto } from './dto/incidencia.dto';

@Controller('incidencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidenciasController {
  constructor(private readonly service: IncidenciasService) {}
  @Get() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) findAll() { return this.service.findAll(); }
  @Post() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO) create(@Body() dto: IncidenciaDto, @Req() req: { user: { id: number } }) { return this.service.create(dto, req.user.id); }
  @Patch(':id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO) update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<IncidenciaDto>) { return this.service.update(id, dto); }
}
