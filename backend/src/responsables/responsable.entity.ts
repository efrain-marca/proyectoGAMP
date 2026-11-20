import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('responsables')
export class Responsable {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 160 }) nombre: string;
  @Column({ length: 140, nullable: true }) cargo: string;
  @Column({ length: 120, nullable: true }) unidad: string;
  @Column({ name: 'fecha_asignacion', type: 'date' }) fechaAsignacion: string;
  @Column({ name: 'fecha_finalizacion', type: 'date', nullable: true }) fechaFinalizacion: string | null;
  @Column({ default: true }) activo: boolean;
  @Column({ type: 'text', nullable: true }) observaciones: string | null;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario | null;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'asignado_por_id' }) asignadoPor: Usuario | null;
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.responsables, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
