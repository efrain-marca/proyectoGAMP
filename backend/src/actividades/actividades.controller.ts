import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { ActividadDto } from './dto/actividad.dto';
import { ActualizarActividadDto } from './dto/actualizar-actividad.dto';
import { ActividadesService } from './actividades.service';

@Controller('actividades') @UseGuards(JwtAuthGuard, RolesGuard)
export class ActividadesController {
  constructor(private readonly service: ActividadesService) {}
  @Get() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) findAll() { return this.service.findAll(); }
  @Post() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO) create(@Body() dto: ActividadDto) { return this.service.create(dto); }
  @Patch(':id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO) update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarActividadDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
