import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';

export enum PrioridadIncidencia {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export enum EstadoIncidencia {
  ABIERTA = 'ABIERTA',
  EN_ATENCION = 'EN_ATENCION',
  RESUELTA = 'RESUELTA',
  CERRADA = 'CERRADA',
}

@Entity('incidencias')
export class Incidencia {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 180 }) titulo: string;
  @Column({ type: 'text' }) descripcion: string;
  @Column({ type: 'enum', enum: PrioridadIncidencia, default: PrioridadIncidencia.MEDIA }) prioridad: PrioridadIncidencia;
  @Column({ type: 'enum', enum: EstadoIncidencia, default: EstadoIncidencia.ABIERTA }) estado: EstadoIncidencia;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Actividad, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'actividad_id' }) actividad: Actividad | null;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
}
