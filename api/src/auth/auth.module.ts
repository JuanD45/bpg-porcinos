import {
  Body,
  Controller,
  Get,
  HttpCode,
  Injectable,
  Module,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { CurrentUser, Public, UsuarioSesion } from '../common/auth.decorators';
import { Usuario } from '../database/entities';

export class LoginDto {
  @IsEmail({}, { message: 'Escribe un correo válido.' }) email: string;
  @IsString() @MinLength(1, { message: 'Escribe la contraseña.' }) password: string;
}

export class CambiarPasswordDto {
  @IsString() actual: string;
  @IsString() @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' }) nueva: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Se ejecuta en cada petición: el usuario debe seguir existiendo y estar activo. */
  async validate(payload: { sub: string }): Promise<UsuarioSesion> {
    const u = await this.repo.findOne({ where: { id: payload.sub } });
    if (!u || !u.activo) throw new UnauthorizedException('Tu sesión ya no es válida.');
    return { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol };
  }
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const u = await this.repo.findOne({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, email: true, nombre: true, rol: true, activo: true, passwordHash: true },
    });
    const ok = u && u.activo && (await bcrypt.compare(dto.password, u.passwordHash));
    if (!ok) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    const usuario: UsuarioSesion = { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol };
    return { token: await this.jwt.signAsync({ sub: u.id, rol: u.rol }), usuario };
  }

  async cambiarPassword(id: string, dto: CambiarPasswordDto) {
    const u = await this.repo.findOne({ where: { id }, select: { id: true, passwordHash: true } });
    if (!u || !(await bcrypt.compare(dto.actual, u.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual no es correcta.');
    }
    await this.repo.update(id, { passwordHash: await bcrypt.hash(dto.nueva, 10) });
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: UsuarioSesion) {
    return user;
  }

  @Post('cambiar-password')
  @HttpCode(204)
  async cambiarPassword(@CurrentUser() user: UsuarioSesion, @Body() dto: CambiarPasswordDto) {
    await this.service.cambiarPassword(user.id, dto);
  }
}

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '12h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
