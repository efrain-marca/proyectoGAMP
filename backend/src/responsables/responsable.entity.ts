import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from '../proyectos/proyecto.entity';

@Entity('responsables')
export class Responsable {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 160 }) nombre: string;
  @Column({ length: 140, nullable: true }) cargo: string;
  @Column({ length: 120, nullable: true }) unidad: string;
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.responsables, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'proyecto_id' }) proyecto: Proyecto;
}
