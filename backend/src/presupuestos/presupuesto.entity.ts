import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';

@Entity('presupuestos')
export class Presupuesto {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'monto_asignado', type: 'decimal', precision: 15, scale: 2 }) montoAsignado: string;
  @Column({ name: 'monto_ejecutado', type: 'decimal', precision: 15, scale: 2, default: 0 }) montoEjecutado: string;
  @Column({ type: 'text', nullable: true }) justificacion: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.presupuestos, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
}
