import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly repo: Repository<Usuario>) {}

  findAll(): Promise<Usuario[]> {
    return this.repo.find({ select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true, updatedAt: true } });
  }

  async findByEmail(correo: string): Promise<Usuario | null> {
    return this.repo.createQueryBuilder('usuario').addSelect('usuario.passwordHash').where('usuario.correo = :correo', { correo }).getOne();
  }

  async setResetToken(correo: string, token: string, expires: Date): Promise<void> {
    const user = await this.repo.findOneBy({ correo });
    if (!user) return;
    await this.repo.update(user.id, { resetToken: token, resetExpires: expires });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const user = await this.repo.createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .addSelect('usuario.resetToken')
      .addSelect('usuario.resetExpires')
      .where('usuario.resetToken = :token', { token })
      .getOne();
    if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) throw new Error('El enlace de recuperación es inválido o expiró');
    await this.repo.update(user.id, { passwordHash: await bcrypt.hash(password, 12), resetToken: null, resetExpires: null });
  }

  findForAuthentication(id: number): Promise<Usuario | null> {
    return this.repo.findOneBy({ id });
  }

  async findOne(id: number): Promise<Usuario> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CrearUsuarioDto): Promise<Usuario> {
    if (await this.repo.existsBy({ correo: dto.correo })) throw new ConflictException('El correo ya está registrado');
    const { password, ...fields } = dto;
    const usuario = this.repo.create({ ...fields, passwordHash: await bcrypt.hash(password, 12) });
    return this.repo.save(usuario);
  }

  async update(id: number, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    if (dto.correo && dto.correo !== usuario.correo && await this.repo.existsBy({ correo: dto.correo })) {
      throw new ConflictException('El correo ya está registrado');
    }
    const { password, ...fields } = dto;
    Object.assign(usuario, fields);
    if (password) usuario.passwordHash = await bcrypt.hash(password, 12);
    return this.repo.save(usuario);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.repo.remove(usuario);
  }
}
