import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('reprogramaciones')
export class Reprogramacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'fecha_fin_anterior', type: 'date' }) fechaFinAnterior: string;
  @Column({ name: 'fecha_fin_nueva', type: 'date' }) fechaFinNueva: string;
  @Column({ type: 'text' }) motivo: string;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @ManyToOne(() => Actividad, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'actividad_id' }) actividad: Actividad;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
}
