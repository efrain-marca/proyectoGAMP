import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.service.login(dto.correo, dto.password); }
  @Post('forgot-password') forgot(@Body() dto: { correo: string }) { return this.service.forgotPassword(dto.correo); }
  @Post('reset-password') reset(@Body() dto: { token: string; password: string }) { return this.service.resetPassword(dto.token, dto.password); }
}
