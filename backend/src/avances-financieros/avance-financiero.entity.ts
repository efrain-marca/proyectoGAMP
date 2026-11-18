import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('avances_financieros')
export class AvanceFinanciero {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) monto: string;
  @Column({ length: 120, nullable: true }) referencia: string;
  @Column({ type: 'text', nullable: true }) observacion: string;
  @CreateDateColumn({ name: 'fecha_registro' }) fecha: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
}
