import { Body, Controller, Get, Injectable, Module, Put } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsNumber, Max, Min } from 'class-validator';
import { Repository } from 'typeorm';
import { Roles } from '../common/auth.decorators';
import { Umbrales, UMBRALES_POR_DEFECTO } from '../common/cumplimiento';
import { Configuracion } from '../database/entities';

/** Metas mínimas por nivel, como fracción (1 = 100 %). */
export class UmbralesDto {
  @IsNumber() @Min(0) @Max(1) F: number;
  @IsNumber() @Min(0) @Max(1) My: number;
  @IsNumber() @Min(0) @Max(1) Mn: number;
}

@Injectable()
export class ConfiguracionService {
  constructor(@InjectRepository(Configuracion) private readonly repo: Repository<Configuracion>) {}

  async umbrales(): Promise<Umbrales> {
    const fila = await this.repo.findOne({ where: { clave: 'umbrales' } });
    return { ...UMBRALES_POR_DEFECTO, ...(fila?.valor || {}) };
  }

  async guardarUmbrales(dto: UmbralesDto): Promise<Umbrales> {
    const valor: Umbrales = { F: dto.F, My: dto.My, Mn: dto.Mn };
    await this.repo.save({ clave: 'umbrales', valor });
    return valor;
  }
}

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly service: ConfiguracionService) {}

  @Get('umbrales') umbrales() {
    return this.service.umbrales();
  }

  @Put('umbrales')
  @Roles('admin')
  guardar(@Body() dto: UmbralesDto) {
    return this.service.guardarUmbrales(dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Configuracion])],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
