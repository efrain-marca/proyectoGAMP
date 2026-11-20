import { BadRequestException, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, UserRole } from '../common/roles';
import { DocumentosService } from './documentos.service';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@Controller('documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Get('proyecto/:id') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO, UserRole.CONSULTA) list(@Param('id', ParseIntPipe) id: number) { return this.service.listByProject(id); }

  @Post('subir')
  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR, UserRole.TECNICO)
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
      cb(allowed.includes(file.mimetype) ? null : new BadRequestException('Solo se permiten PDF, JPG y PNG'), allowed.includes(file.mimetype));
    },
  }))
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: { user: { id: number }; body: Record<string, string> }) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo');
    return this.service.saveUpload(file, req.user.id, req.body);
  }

  @Patch(':id/publicar') @Roles(UserRole.ADMINISTRADOR, UserRole.SUPERVISOR) publish(@Param('id', ParseIntPipe) id: number) { return this.service.publish(id); }
}
