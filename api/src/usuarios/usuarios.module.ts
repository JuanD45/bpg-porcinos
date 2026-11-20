import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Logger,
  Module,
  NotFoundException,
  OnApplicationBootstrap,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { CurrentUser, Roles, UsuarioSesion } from '../common/auth.decorators';
import { esDuplicado } from '../common/db-errors';
import { Rol, ROLES, Usuario } from '../database/entities';

export class CrearUsuarioDto {
  @IsEmail({}, { message: 'Escribe un correo válido.' }) email: string;
  @IsString() @MinLength(2) @MaxLength(120) nombre: string;
  @IsIn(ROLES) rol: Rol;
  @IsString() @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }) password: string;
}

export class ActualizarUsuarioDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) nombre?: string;
  @IsOptional() @IsIn(ROLES) rol?: Rol;
  @IsOptional() @IsBoolean() activo?: boolean;
  @IsOptional() @IsString() @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password?: string;
}

@Injectable()
export class UsuariosService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Usuarios');

  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
    private readonly config: ConfigService,
  ) {}

  /** Crea el administrador inicial si la tabla de usuarios está vacía. */
  async onApplicationBootstrap() {
    if ((await this.repo.count()) > 0) return;
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn('No hay usuarios. Define ADMIN_EMAIL y ADMIN_PASSWORD para crear el administrador inicial.');
      return;
    }
    await this.crear({
      email,
      password,
      nombre: this.config.get<string>('ADMIN_NOMBRE') || 'Administrador',
      rol: 'admin',
    });
    this.logger.log(`Administrador inicial creado: ${email}`);
  }

  listar() {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    const u = this.repo.create({
      email: dto.email.trim().toLowerCase(),
      nombre: dto.nombre.trim(),
      rol: dto.rol,
      passwordHash: await bcrypt.hash(dto.password, 10),
      activo: true,
    });
    try {
      const guardado = await this.repo.save(u);
      delete guardado.passwordHash;
      return guardado;
    } catch (e) {
      if (esDuplicado(e)) throw new ConflictException('Ya existe un usuario con ese correo.');
      throw e;
    }
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto, actual: UsuarioSesion): Promise<Usuario> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Usuario no encontrado.');
    if (id === actual.id && (dto.activo === false || (dto.rol && dto.rol !== 'admin'))) {
      throw new BadRequestException('No puedes desactivarte ni quitarte el rol de administrador.');
    }
    if (dto.nombre !== undefined) u.nombre = dto.nombre.trim();
    if (dto.rol !== undefined) u.rol = dto.rol;
    if (dto.activo !== undefined) u.activo = dto.activo;
    if (dto.password) u.passwordHash = await bcrypt.hash(dto.password, 10);
    const guardado = await this.repo.save(u);
    delete guardado.passwordHash;
    return guardado;
  }
}

@Controller('usuarios')
@Roles('admin')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get() listar() {
    return this.service.listar();
  }

  @Post() crear(@Body() dto: CrearUsuarioDto) {
    return this.service.crear(dto);
  }

  @Patch(':id') actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @CurrentUser() actual: UsuarioSesion,
  ) {
    return this.service.actualizar(id, dto, actual);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
