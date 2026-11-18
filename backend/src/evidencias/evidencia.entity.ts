import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actividad } from '../actividades/actividad.entity';
import { Documento } from '../documentos/documento.entity';
import { Proyecto } from '../proyectos/proyecto.entity';

export enum TipoEvidencia {
  FOTOGRAFICA = 'FOTOGRAFICA',
  DOCUMENTAL = 'DOCUMENTAL',
}

@Entity('evidencias')
export class Evidencia {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
  @ManyToOne(() => Actividad, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'actividad_id' }) actividad: Actividad | null;
  @ManyToOne(() => Documento, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'documento_id' }) documento: Documento;
  @Column({ type: 'enum', enum: TipoEvidencia }) tipo: TipoEvidencia;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
