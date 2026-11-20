import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Public } from './common/auth.decorators';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ENTIDADES } from './database/entities';
import { EsquemaInicial1763600000000 } from './database/migrations/1763600000000-EsquemaInicial';
import { DatosIniciales1763600000001 } from './database/migrations/1763600000001-DatosIniciales';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { EvidenciasModule } from './evidencias/evidencias.module';
import { GranjasModule } from './granjas/granjas.module';
import { RequisitosModule } from './requisitos/requisitos.module';
import { StorageModule } from './storage/storage.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  estado() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: ENTIDADES,
        // Las migraciones crean las tablas y cargan los requisitos al arrancar.
        migrations: [EsquemaInicial1763600000000, DatosIniciales1763600000001],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    StorageModule,
    AuthModule,
    UsuariosModule,
    ConfiguracionModule,
    RequisitosModule,
    GranjasModule,
    EvaluacionesModule,
    EvidenciasModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
