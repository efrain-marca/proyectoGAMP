import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [UsuariosModule, PassportModule, JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const expiresIn = Number(config.get<string>('JWT_EXPIRES_IN', '28800'));
      if (!Number.isSafeInteger(expiresIn) || expiresIn <= 0) throw new Error('JWT_EXPIRES_IN debe ser un entero positivo en segundos');
      return { secret: config.getOrThrow('JWT_SECRET'), signOptions: { expiresIn } };
    },
  })],
  controllers: [AuthController], providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
