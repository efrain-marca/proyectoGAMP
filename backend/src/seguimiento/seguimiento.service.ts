import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { AvanceFinanciero } from '../avances-financieros/avance-financiero.entity';
import { CrearAvanceFinancieroDto } from '../avances-financieros/dto/crear-avance-financiero.dto';
import { AvanceFisico } from '../avances-fisicos/avance-fisico.entity';
import { CrearAvanceFisicoDto } from '../avances-fisicos/dto/crear-avance-fisico.dto';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { UserRole } from '../common/roles';
import { Responsable } from '../responsables/responsable.entity';

@Injectable()
export class SeguimientoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Proyecto) private readonly proyectos: Repository<Proyecto>,
    @InjectRepository(Actividad) private readonly actividades: Repository<Actividad>,
    @InjectRepository(AvanceFisico) private readonly fisicos: Repository<AvanceFisico>,
    @InjectRepository(AvanceFinanciero) private readonly financieros: Repository<AvanceFinanciero>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Responsable) private readonly responsables: Repository<Responsable>,
  ) {}

  listPhysical(): Promise<AvanceFisico[]> {
    return this.fisicos.find({ relations: { proyecto: true, actividad: true, usuario: true }, order: { fecha: 'DESC' } });
  }

  async addPhysical(dto: CrearAvanceFisicoDto, userId: number): Promise<AvanceFisico> {
    const usuarioRol = await this.usuarios.findOneBy({ id: userId });
    if (usuarioRol?.rol !== UserRole.ADMINISTRADOR && usuarioRol?.rol !== UserRole.SUPERVISOR) {
      const assigned = await this.responsables.exists({ where: { usuario: { id: userId }, proyecto: { id: dto.proyectoId }, activo: true } });
      if (!assigned) throw new ForbiddenException('No tiene asignado este proyecto');
    }
    const [proyecto, usuario] = await Promise.all([this.proyectos.findOneBy({ id: dto.proyectoId }), this.usuarios.findOneBy({ id: userId })]);
    if (!proyecto || !usuario) throw new NotFoundException('Proyecto o usuario no encontrado');
    let actividad: Actividad | null = null;
    if (dto.actividadId) {
      actividad = await this.actividades.findOne({ where: { id: dto.actividadId }, relations: { proyecto: true } });
      if (!actividad || actividad.proyecto.id !== proyecto.id) throw new NotFoundException('La actividad no pertenece al proyecto indicado');
    }
    if (dto.porcentaje < 0 || dto.porcentaje > 100) throw new ForbiddenException('El porcentaje debe estar entre 0 y 100');
    const calculated = await this.getProjectPhysicalAdvance(proyecto.id);
    const previous = actividad ? Number(actividad.avance) : (calculated >= 0 ? calculated : 0);
    if (dto.porcentaje < previous) throw new ForbiddenException('No se permiten disminuciones arbitrarias del avance');
    const advance = this.fisicos.create({
      proyecto,
      actividad: actividad ?? undefined,
      usuario,
      porcentaje: String(dto.porcentaje),
      porcentajeAnterior: String(previous),
      incremento: String(dto.porcentaje - previous),
      descripcionTrabajo: dto.descripcionTrabajo ?? null,
      observacion: dto.observacion,
      estado: 'EN_REVISION',
      publicado: false,
    });
    if (actividad) {
      actividad.avance = String(dto.porcentaje);
      await this.actividades.save(actividad);
    }
    return this.fisicos.save(advance);
  }

  private async getProjectPhysicalAdvance(projectId: number): Promise<number> {
    const activities = await this.actividades.find({ where: { proyecto: { id: projectId } } });
    if (!activities.length) return 0;
    if (activities.some((activity) => Number(activity.peso) <= 0)) return -1;
    const totalWeight = activities.reduce((sum, activity) => sum + Number(activity.peso), 0);
    if (Math.abs(totalWeight - 100) > 0.01) return -1;
    return activities.reduce((sum, activity) => sum + Number(activity.peso) * Number(activity.avance) / 100, 0);
  }

  listFinancial(): Promise<AvanceFinanciero[]> {
    return this.financieros.find({ relations: { proyecto: true, usuario: true }, order: { fecha: 'DESC' } });
  }

  async addFinancial(dto: CrearAvanceFinancieroDto, userId: number, role: UserRole): Promise<AvanceFinanciero> {
    return this.dataSource.transaction(async (manager) => {
      const proyecto = await manager.getRepository(Proyecto).findOne({ where: { id: dto.proyectoId }, lock: { mode: 'pessimistic_write' } });
      if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
      const usuario = await manager.getRepository(Usuario).findOneBy({ id: userId });
      if (!usuario) throw new NotFoundException('Usuario no encontrado');
      const result = await manager.getRepository(AvanceFinanciero)
        .createQueryBuilder('avance')
        .select('COALESCE(SUM(avance.monto), 0)', 'total')
        .where('avance.proyecto_id = :proyectoId', { proyectoId: proyecto.id })
        .getRawOne<{ total: string }>();
      const ejecutado = Number(result?.total ?? 0);
      if (ejecutado + dto.monto > Number(proyecto.presupuesto) && role !== UserRole.ADMINISTRADOR) {
        throw new ForbiddenException('El monto excede el presupuesto autorizado; se requiere autorización de ADMINISTRADOR');
      }
      return manager.getRepository(AvanceFinanciero).save(manager.getRepository(AvanceFinanciero).create({
        proyecto, usuario, monto: String(dto.monto), referencia: dto.referencia, observacion: dto.observacion,
      }));
    });
  }

  async alerts() {
    const today = new Date().toISOString().slice(0, 10);
    const lateActivities = await this.actividades.createQueryBuilder('actividad')
      .leftJoinAndSelect('actividad.proyecto', 'proyecto')
      .where('actividad.fechaFin < :today AND actividad.avance < 100', { today })
      .orderBy('actividad.fechaFin', 'ASC')
      .getMany();
    return lateActivities.map((a) => ({
      tipo: 'ACTIVIDAD_VENCIDA',
      proyectoId: a.proyecto.id,
      proyecto: a.proyecto.nombre,
      actividadId: a.id,
      actividad: a.nombre,
      fechaFin: a.fechaFin,
      avance: Number(a.avance),
    }));
  }

  pendingPhysical(): Promise<AvanceFisico[]> {
    return this.fisicos.find({ where: [{ estado: 'EN_REVISION' }, { estado: 'BORRADOR' }], relations: { proyecto: true, actividad: true, usuario: true }, order: { fecha: 'DESC' } });
  }

  async approvePhysical(id: number): Promise<AvanceFisico> {
    const advance = await this.fisicos.findOne({ where: { id }, relations: { proyecto: true, actividad: true } });
    if (!advance) throw new NotFoundException('Avance no encontrado');
    advance.estado = 'PUBLICADO';
    advance.publicado = true;
    return this.fisicos.save(advance);
  }

  async observePhysical(id: number, observacion: string): Promise<AvanceFisico> {
    const advance = await this.fisicos.findOneBy({ id });
    if (!advance) throw new NotFoundException('Avance no encontrado');
    advance.estado = 'OBSERVADO';
    advance.publicado = false;
    advance.observacion = observacion || advance.observacion;
    return this.fisicos.save(advance);
  }

  async dashboard() {
    const projects = await this.proyectos.find();
    const activities = await this.actividades.find({ relations: { proyecto: true } });
    const financial = await this.financieros.createQueryBuilder('avance').select('COALESCE(SUM(avance.monto), 0)', 'total').getRawOne<{ total: string }>();
    const incidencias = await this.dataSource.getRepository('incidencias').count();
    const pendientes = await this.dataSource.getRepository('incidencias').count({ where: { estado: 'ABIERTA' } });
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalProyectos: projects.length,
      enEjecutucion: projects.filter((project) => project.estado === 'EN EJECUCIÓN').length,
      concluidos: projects.filter((project) => project.estado === 'CONCLUIDO').length,
      suspendidos: projects.filter((project) => project.estado === 'SUSPENDIDO' || project.estado === 'PAUSADO').length,
      presupuestoVigente: projects.reduce((sum, project) => sum + Number(project.presupuesto), 0),
      ejecucionFinanciera: Number(financial?.total ?? 0),
      incidencias: Number(incidencias),
      incidenciasPendientes: Number(pendientes),
      actividadesProximas: activities.filter((activity) => activity.fechaFin >= today).slice(0, 10),
    };
  }

  async projectReport() {
    const projects = await this.proyectos.find({ order: { codigo: 'ASC' } });
    const finance = await this.financieros.createQueryBuilder('avance')
      .select('avance.proyecto_id', 'proyectoId')
      .addSelect('SUM(avance.monto)', 'ejecutado')
      .groupBy('avance.proyecto_id')
      .getRawMany<{ proyectoId: number; ejecutado: string }>();
    const totals = new Map(finance.map((row) => [Number(row.proyectoId), Number(row.ejecutado)]));
    return projects.map((project) => {
      const ejecutado = totals.get(project.id) ?? 0;
      const presupuesto = Number(project.presupuesto);
      return { id: project.id, codigo: project.codigo, nombre: project.nombre, estado: project.estado, presupuesto, ejecutado,
        porcentajeEjecucion: presupuesto > 0 ? Number((ejecutado / presupuesto * 100).toFixed(2)) : 0 };
    });
  }
}
