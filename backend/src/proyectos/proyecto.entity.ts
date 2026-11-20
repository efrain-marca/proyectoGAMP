import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { Responsable } from '../responsables/responsable.entity';

export enum EstadoProyecto {
  REGISTRADO = 'REGISTRADO',
  PLANIFICADO = 'PLANIFICADO',
  EN_EJECUCION = 'EN EJECUCIÓN',
  PAUSADO = 'PAUSADO',
  SUSPENDIDO = 'SUSPENDIDO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ length: 30 }) codigo: string;
  @Column({ length: 180 }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ name: 'tipo_proyecto', length: 100, default: 'OTRO' }) tipoProyecto: string;
  @Column({ length: 180 }) ubicacion: string;
  @Column({ type: 'varchar', length: 120, nullable: true }) distrito: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) comunidad: string | null;
  @Column({ name: 'unidad_organizacional', type: 'varchar', length: 180, nullable: true }) unidadOrganizacional: string | null;
  @Column({ type: 'date', name: 'fecha_inicio' }) fechaInicio: string;
  @Column({ type: 'date', name: 'fecha_fin' }) fechaFin: string;
  @Column({ name: 'presupuesto_inicial', type: 'decimal', precision: 15, scale: 2, nullable: true }) presupuestoInicial: string | null;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) presupuesto: string;
  @Column({ type: 'enum', enum: EstadoProyecto, default: EstadoProyecto.PLANIFICADO }) estado: EstadoProyecto;
  @Column({ type: 'varchar', length: 100, nullable: true }) modalidad: string | null;
  @Column({ name: 'latitud', type: 'decimal', precision: 10, scale: 7, nullable: true }) latitud: string | null;
  @Column({ name: 'longitud', type: 'decimal', precision: 10, scale: 7, nullable: true }) longitud: string | null;
  @Column({ type: 'text', nullable: true }) observaciones: string | null;
  @Column({ name: 'publicado', default: false }) publicado: boolean;
  @Column({ name: 'publicar_financiero', default: false }) publicarFinanciero: boolean;
  @OneToMany(() => Actividad, (actividad) => actividad.proyecto) actividades: Actividad[];
  @OneToMany(() => Presupuesto, (presupuesto) => presupuesto.proyecto) presupuestos: Presupuesto[];
  @OneToMany(() => Responsable, (responsable) => responsable.proyecto) responsables: Responsable[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
