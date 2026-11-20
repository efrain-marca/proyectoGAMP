import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('avances_fisicos')
export class AvanceFisico {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) porcentaje: string;
  @Column({ name: 'porcentaje_anterior', type: 'decimal', precision: 5, scale: 2, default: 0 }) porcentajeAnterior: string;
  @Column({ name: 'incremento', type: 'decimal', precision: 5, scale: 2, default: 0 }) incremento: string;
  @Column({ name: 'descripcion_trabajo', type: 'text', nullable: true }) descripcionTrabajo: string | null;
  @Column({ type: 'varchar', length: 20, default: 'BORRADOR' }) estado: 'BORRADOR' | 'EN_REVISION' | 'OBSERVADO' | 'APROBADO' | 'PUBLICADO';
  @Column({ name: 'publicado', default: false }) publicado: boolean;
  @Column({ type: 'text', nullable: true }) observacion: string;
  @CreateDateColumn({ name: 'fecha_registro' }) fecha: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Actividad, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'actividad_id' }) actividad: Actividad;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
}
