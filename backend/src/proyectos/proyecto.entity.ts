import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { Responsable } from '../responsables/responsable.entity';

export enum EstadoProyecto {
  PLANIFICADO = 'PLANIFICADO',
  EN_EJECUCION = 'EN EJECUCIÓN',
  PAUSADO = 'PAUSADO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ length: 30 }) codigo: string;
  @Column({ length: 180 }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ length: 180 }) ubicacion: string;
  @Column({ type: 'date', name: 'fecha_inicio' }) fechaInicio: string;
  @Column({ type: 'date', name: 'fecha_fin' }) fechaFin: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) presupuesto: string;
  @Column({ type: 'enum', enum: EstadoProyecto, default: EstadoProyecto.PLANIFICADO }) estado: EstadoProyecto;
  @OneToMany(() => Actividad, (actividad) => actividad.proyecto) actividades: Actividad[];
  @OneToMany(() => Presupuesto, (presupuesto) => presupuesto.proyecto) presupuestos: Presupuesto[];
  @OneToMany(() => Responsable, (responsable) => responsable.proyecto) responsables: Responsable[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
