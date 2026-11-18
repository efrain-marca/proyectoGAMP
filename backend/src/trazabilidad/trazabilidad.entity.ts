import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

export enum OperacionTrazabilidad {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',
  ACCEDER = 'ACCEDER',
}

@Entity('trazabilidad')
export class Trazabilidad {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: string;
  @Column({ length: 100 }) entidad: string;
  @Column({ name: 'entidad_id', length: 80 }) entidadId: string;
  @Column({ type: 'enum', enum: OperacionTrazabilidad }) operacion: OperacionTrazabilidad;
  @Column({ name: 'valores_anteriores', type: 'json', nullable: true }) valoresAnteriores: Record<string, unknown> | null;
  @Column({ name: 'valores_nuevos', type: 'json', nullable: true }) valoresNuevos: Record<string, unknown> | null;
  @Column({ name: 'fecha_hora', type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' }) fechaHora: Date;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario | null;
}
