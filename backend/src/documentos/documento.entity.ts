import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { AvanceFisico } from '../avances-fisicos/avance-fisico.entity';
import { Incidencia } from '../incidencias/incidencia.entity';

@Entity('documentos')
@Check('chk_documento_tamano', 'tamano_bytes <= 10485760')
export class Documento {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'nombre_original', length: 255 }) nombreOriginal: string;
  @Column({ name: 'ruta_archivo', length: 500 }) rutaArchivo: string;
  @Column({ name: 'mime_type', length: 100 }) mimeType: string;
  @Column({ name: 'tamano_bytes', type: 'int', unsigned: true }) tamanoBytes: number;
  @Column({ type: 'text', nullable: true }) descripcion: string | null;
  @Column({ type: 'varchar', length: 40, default: 'OTRO' }) tipo: 'FOTOGRAFIA' | 'PDF' | 'DOCUMENTO' | 'OTRO';
  @Column({ default: false }) publicado: boolean;
  @Column({ name: 'version', type: 'int', unsigned: true, default: 1 }) version: number;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Actividad, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'actividad_id' }) actividad: Actividad | null;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
  @ManyToOne(() => AvanceFisico, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'avance_id' }) avance: AvanceFisico | null;
  @ManyToOne(() => Incidencia, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'incidencia_id' }) incidencia: Incidencia | null;
}
