import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PublicoService } from './publico.service';

@Controller('publico')
export class PublicoController {
  constructor(private readonly service: PublicoService) {}

  @Get('proyectos') projects(@Query() query: Record<string, string>) { return this.service.projects(query); }
  @Get('proyectos/:id') project(@Param('id', ParseIntPipe) id: number) { return this.service.project(id); }
  @Get('estadisticas') statistics() { return this.service.statistics(); }
  @Get('mapa') map() { return this.service.map(); }
}
