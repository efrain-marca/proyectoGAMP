import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../common/roles';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 160 })
  nombre: string;

  @Index({ unique: true })
  @Column({ length: 190 })
  correo: string;

  @Column({ name: 'password_hash', select: false, length: 100 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CONSULTA })
  rol: UserRole;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'reset_token', type: 'varchar', length: 128, nullable: true, select: false }) resetToken: string | null;
  @Column({ name: 'reset_expires', type: 'datetime', nullable: true, select: false }) resetExpires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
