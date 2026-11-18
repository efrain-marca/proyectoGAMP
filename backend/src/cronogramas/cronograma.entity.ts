import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('cronogramas')
@Index('uq_cronograma_version', ['proyecto', 'version'], { unique: true })
export class Cronograma {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int', unsigned: true, default: 1 }) version: number;
  @Column({ name: 'fecha_inicio', type: 'date' }) fechaInicio: string;
  @Column({ name: 'fecha_fin', type: 'date' }) fechaFin: string;
  @Column({ type: 'text', nullable: true }) observacion: string | null;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
}
