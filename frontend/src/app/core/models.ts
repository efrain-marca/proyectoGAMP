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
  estado: 'PLANIFICADO' | 'EN EJECUCIÓN' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
}
