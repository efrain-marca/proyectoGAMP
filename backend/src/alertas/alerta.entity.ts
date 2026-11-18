import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Proyecto } from '../proyectos/proyecto.entity';

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 60 }) tipo: string;
  @Column({ length: 500 }) mensaje: string;
  @Column({ default: false }) atendida: boolean;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Actividad, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'actividad_id' }) actividad: Actividad | null;
}
