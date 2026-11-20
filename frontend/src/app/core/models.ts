export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'SUPERVISOR' | 'TECNICO' | 'CONSULTA';
  activo: boolean;
}
export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: string | number;
  estado: 'REGISTRADO' | 'PLANIFICADO' | 'EN EJECUCIÓN' | 'SUSPENDIDO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
  tipoProyecto?: string;
  distrito?: string;
  comunidad?: string;
  unidadOrganizacional?: string;
  modalidad?: string;
  latitud?: number | string;
  longitud?: number | string;
  observaciones?: string;
  publicado?: boolean;
  publicarFinanciero?: boolean;
}

export interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  avance: string | number;
  proyecto: Proyecto;
}

export interface AvanceFisico {
  id: number;
  porcentaje: string | number;
  observacion?: string;
  fecha: string;
  proyecto: Proyecto;
  actividad?: Actividad;
  usuario: Usuario;
  estado?: string;
}

export interface AvanceFinanciero {
  id: number;
  monto: string | number;
  referencia?: string;
  observacion?: string;
  fecha: string;
  proyecto: Proyecto;
  usuario: Usuario;
}

export interface Alerta {
  tipo: string;
  proyectoId: number;
  proyecto: string;
  actividadId: number;
  actividad: string;
  fechaFin: string;
  avance: number;
}

export interface ReporteProyecto {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  presupuesto: number;
  ejecutado: number;
  porcentajeEjecucion: number;
}

export interface PublicProject {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  distrito?: string;
  comunidad?: string;
  tipoProyecto?: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number | string;
  latitud?: number | string;
  longitud?: number | string;
  avanceFisico: number;
  fotografiaPrincipal?: string;
}

export interface PublicStatistics {
  totalObras: number;
  enEjecucion: number;
  concluidas: number;
  suspendidas: number;
  promedioAvanceFisico: number;
  presupuestoPublico: number;
}
