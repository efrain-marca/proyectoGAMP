import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';

@Entity('actividades')
export class Actividad {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 180 }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ type: 'date', name: 'fecha_inicio' }) fechaInicio: string;
  @Column({ type: 'date', name: 'fecha_fin' }) fechaFin: string;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 }) avance: string;
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.actividades, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
