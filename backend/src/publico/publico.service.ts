import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto, EstadoProyecto } from '../proyectos/proyecto.entity';
import { Actividad } from '../actividades/actividad.entity';
import { AvanceFisico } from '../avances-fisicos/avance-fisico.entity';
import { AvanceFinanciero } from '../avances-financieros/avance-financiero.entity';
import { Documento } from '../documentos/documento.entity';

@Injectable()
export class PublicoService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>,
    @InjectRepository(Actividad) private readonly actividades: Repository<Actividad>,
    @InjectRepository(AvanceFisico) private readonly fisicos: Repository<AvanceFisico>,
    @InjectRepository(AvanceFinanciero) private readonly financieros: Repository<AvanceFinanciero>,
    @InjectRepository(Documento) private readonly documentos: Repository<Documento>,
  ) {}

  async projects(query: Record<string, string>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 12)));
    const qb = this.proyectos.createQueryBuilder('proyecto').where('proyecto.publicado = :publicado', { publicado: true });
    const search = query.busqueda?.trim();
    if (search) {
      qb.andWhere('(proyecto.nombre LIKE :search OR proyecto.codigo LIKE :search OR proyecto.distrito LIKE :search OR proyecto.comunidad LIKE :search OR proyecto.tipoProyecto LIKE :search)', { search: `%${search}%` });
    }
    if (query.estado) qb.andWhere('proyecto.estado = :estado', { estado: query.estado });
    if (query.distrito) qb.andWhere('proyecto.distrito = :distrito', { distrito: query.distrito });
    qb.orderBy('proyecto.updatedAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    const cards = await Promise.all(items.map((project) => this.publicCard(project)));
    return { items: cards, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async project(id: number) {
    const proyecto = await this.proyectos.findOneBy({ id, publicado: true });
    if (!proyecto) throw new NotFoundException('Proyecto público no encontrado');
    const [activities, advances, photos, financial] = await Promise.all([
      this.actividades.find({ where: { proyecto: { id } }, order: { fechaInicio: 'ASC' } }),
      this.fisicos.find({ where: { proyecto: { id }, publicado: true }, order: { fecha: 'ASC' } }),
      this.documentos.find({ where: { proyecto: { id }, publicado: true, tipo: 'FOTOGRAFIA' }, order: { createdAt: 'DESC' } }),
      this.financieros.find({ where: { proyecto: { id } }, order: { fecha: 'ASC' } }),
    ]);
    const physical = this.weightedAdvance(activities);
    const lastAdvance = advances.at(-1);
    const executed = financial.reduce((sum, item) => sum + Number(item.monto), 0);
    const vigente = Number(proyecto.presupuesto);
    return {
      ...proyecto,
      avanceFisico: physical,
      ultimoSeguimiento: lastAdvance ? { fecha: lastAdvance.fecha, porcentaje: Number(lastAdvance.porcentaje), descripcion: lastAdvance.descripcionTrabajo } : null,
      evolucion: advances.map((item) => ({ fecha: item.fecha, porcentaje: Number(item.porcentaje), descripcion: item.descripcionTrabajo })),
      cronograma: activities,
      galeria: photos.map((photo) => ({ id: photo.id, nombre: photo.nombreOriginal, ruta: photo.rutaArchivo, fecha: photo.createdAt })),
      financiero: proyecto.publicarFinanciero ? { presupuestoInicial: Number(proyecto.presupuestoInicial ?? proyecto.presupuesto), presupuestoVigente: vigente, ejecutado: executed, saldo: vigente - executed, porcentaje: vigente > 0 ? Number((executed / vigente * 100).toFixed(2)) : 0 } : null,
      responsables: undefined,
    };
  }

  async statistics() {
    const projects = await this.proyectos.find({ where: { publicado: true } });
    const advances = await Promise.all(projects.map((project) => this.activitiesForAdvance(project.id)));
    const average = advances.length ? advances.reduce((sum, value) => sum + value, 0) / advances.length : 0;
    return {
      totalObras: projects.length,
      enEjecucion: projects.filter((project) => project.estado === EstadoProyecto.EN_EJECUCION).length,
      concluidas: projects.filter((project) => project.estado === EstadoProyecto.CONCLUIDO).length,
      suspendidas: projects.filter((project) => project.estado === EstadoProyecto.SUSPENDIDO || project.estado === EstadoProyecto.PAUSADO).length,
      promedioAvanceFisico: Number(average.toFixed(2)),
      presupuestoPublico: projects.filter((project) => project.publicarFinanciero).reduce((sum, project) => sum + Number(project.presupuesto), 0),
    };
  }

  async map() {
    const projects = await this.proyectos.find({ where: { publicado: true } });
    return Promise.all(projects.filter((project) => project.latitud && project.longitud).map(async (project) => ({
      id: project.id,
      nombre: project.nombre,
      codigo: project.codigo,
      estado: project.estado,
      latitud: Number(project.latitud),
      longitud: Number(project.longitud),
      avance: await this.activitiesForAdvance(project.id),
    })));
  }

  private async publicCard(project: Proyecto) {
    const activities = await this.actividades.find({ where: { proyecto: { id: project.id } } });
    const photo = await this.documentos.findOne({ where: { proyecto: { id: project.id }, publicado: true, tipo: 'FOTOGRAFIA' }, order: { createdAt: 'DESC' } });
    return { ...project, avanceFisico: this.weightedAdvance(activities), fotografiaPrincipal: photo ? photo.rutaArchivo : null };
  }

  private async activitiesForAdvance(projectId: number): Promise<number> {
    const activities = await this.actividades.find({ where: { proyecto: { id: projectId } } });
    return this.weightedAdvance(activities);
  }

  private weightedAdvance(activities: Actividad[]): number {
    if (!activities.length) return 0;
    const totalWeight = activities.reduce((sum, activity) => sum + Number(activity.peso), 0);
    if (Math.abs(totalWeight - 100) > 0.01) return 0;
    return Number(activities.reduce((sum, activity) => sum + Number(activity.peso) * Number(activity.avance) / 100, 0).toFixed(2));
  }
}
