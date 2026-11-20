import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { ActualizarProyectoDto } from './dto/actualizar-proyecto.dto';
import { ProyectoDto } from './dto/proyecto.dto';
import { ProyectosService } from './proyectos.service';

@Controller('proyectos') @UseGuards(JwtAuthGuard, RolesGuard)
export class ProyectosController {
  constructor(private readonly service: ProyectosService) {}
  @Get() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) findAll(@Req() req: { user: { id: number; role: UserRole } }) { return this.service.findAll(req.user.id, req.user.role); }
  @Get(':id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) findOne(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { id: number; role: UserRole } }) { return this.service.findOneForUser(id, req.user.id, req.user.role); }
  @Post() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) create(@Body() dto: ProyectoDto) { return this.service.create(dto); }
  @Patch(':id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarProyectoDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(UserRole.ADMINISTRADOR) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
