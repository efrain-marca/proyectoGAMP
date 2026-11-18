import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';

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
}
