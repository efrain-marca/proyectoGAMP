import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './documento.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Actividad } from '../actividades/actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento) private readonly repo: Repository<Documento>,
    @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>,
    @InjectRepository(Actividad) private readonly actividades: Repository<Actividad>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  listByProject(proyectoId: number): Promise<Documento[]> {
    return this.repo.find({ where: { proyecto: { id: proyectoId } }, relations: { proyecto: true, actividad: true, usuario: true }, order: { createdAt: 'DESC' } });
  }

  async saveUpload(file: Express.Multer.File, usuarioId: number, body: Record<string, string>): Promise<Documento> {
    const proyectoId = Number(body.proyectoId);
    if (!Number.isInteger(proyectoId)) throw new BadRequestException('proyectoId es obligatorio');
    const proyecto = await this.proyectos.findOneBy({ id: proyectoId });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    const usuario = await this.usuarios.findOneBy({ id: usuarioId });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    let actividad: Actividad | null = null;
    if (body.actividadId) {
      actividad = await this.actividades.findOne({ where: { id: Number(body.actividadId) }, relations: { proyecto: true } });
      if (!actividad || actividad.proyecto.id !== proyectoId) throw new BadRequestException('La actividad no pertenece al proyecto');
    }
    const tipo = file.mimetype.startsWith('image/') ? 'FOTOGRAFIA' : file.mimetype === 'application/pdf' ? 'PDF' : 'DOCUMENTO';
    const documento = this.repo.create({
      nombreOriginal: file.originalname,
      rutaArchivo: file.path,
      mimeType: file.mimetype,
      tamanoBytes: file.size,
      descripcion: body.descripcion ?? null,
      tipo,
      publicado: body.publicado === 'true',
      version: 1,
      proyecto,
      actividad,
      usuario,
    });
    return this.repo.save(documento);
  }

  async publish(id: number): Promise<Documento> {
    const documento = await this.repo.findOneBy({ id });
    if (!documento) throw new NotFoundException('Documento no encontrado');
    documento.publicado = true;
    return this.repo.save(documento);
  }
}
