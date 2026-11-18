import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) findAll() { return this.service.findAll(); }
  @Get(':id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() @Roles(UserRole.ADMINISTRADOR) create(@Body() dto: CrearUsuarioDto) { return this.service.create(dto); }
  @Patch(':id') @Roles(UserRole.ADMINISTRADOR) update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarUsuarioDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(UserRole.ADMINISTRADOR) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
