import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private readonly usuarios: UsuariosService, private readonly jwt: JwtService) {}

  async login(correo: string, password: string) {
    const user = await this.usuarios.findByEmail(correo);
    if (!user || !user.activo || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciales incorrectas o cuenta inactiva');
    }
    const access_token = await this.jwt.signAsync({ sub: user.id, correo: user.correo, rol: user.rol, activo: user.activo });
    return { access_token, usuario: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol } };
  }

  async forgotPassword(correo: string): Promise<{ mensaje: string }> {
    const token = randomBytes(32).toString('hex');
    await this.usuarios.setResetToken(correo, token, new Date(Date.now() + 60 * 60 * 1000));
    return { mensaje: 'Si el correo existe, se enviará una instrucción de recuperación.' };
  }

  async resetPassword(token: string, password: string): Promise<{ mensaje: string }> {
    if (password.length < 8) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    try {
      await this.usuarios.resetPassword(token, password);
    } catch {
      throw new BadRequestException('El enlace de recuperación es inválido o expiró');
    }
    return { mensaje: 'Contraseña actualizada correctamente.' };
  }
}
