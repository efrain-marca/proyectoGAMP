import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { ResponsablesService } from './responsables.service';
import { AsignarResponsableDto } from './dto/asignar-responsable.dto';

interface AuthenticatedRequest { user: { id: number } }

@Controller('responsables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsablesController {
  constructor(private readonly service: ResponsablesService) {}

  @Get() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) list() { return this.service.listAll(); }
  @Get('mis-proyectos') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) myProjects(@Req() req: AuthenticatedRequest) { return this.service.myProjects(req.user.id); }
  @Post() @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) assign(@Body() dto: AsignarResponsableDto, @Req() req: AuthenticatedRequest) { return this.service.assign(dto, req.user.id); }
  @Patch(':id/finalizar') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) finalize(@Param('id', ParseIntPipe) id: number) { return this.service.finalize(id); }
}
