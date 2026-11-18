import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly usuarios: UsuariosService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET es obligatorio');
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: secret });
  }

  async validate(payload: { sub: number }) {
    const usuario = await this.usuarios.findForAuthentication(payload.sub);
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Usuario no válido o inactivo');
    return { id: usuario.id, correo: usuario.correo, role: usuario.rol };
  }
}
