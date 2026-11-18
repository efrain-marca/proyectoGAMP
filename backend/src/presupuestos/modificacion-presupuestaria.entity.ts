import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('modificaciones_presupuestarias')
export class ModificacionPresupuestaria {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'monto_anterior', type: 'decimal', precision: 15, scale: 2 }) montoAnterior: string;
  @Column({ name: 'monto_nuevo', type: 'decimal', precision: 15, scale: 2 }) montoNuevo: string;
  @Column({ type: 'text' }) motivo: string;
  @Column({ name: 'created_at', type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' }) createdAt: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'autorizado_por' }) autorizadoPor: Usuario | null;
}
