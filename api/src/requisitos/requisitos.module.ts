import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Roles } from '../common/auth.decorators';
import { claveCodigo } from '../common/cumplimiento';
import { esDuplicado } from '../common/db-errors';
import { Nivel, NIVELES, Requisito } from '../database/entities';
import { EvidenciasModule, EvidenciasService } from '../evidencias/evidencias.module';

export class CrearRequisitoDto {
  @IsString() @MinLength(1) @MaxLength(20) codigo: string;
  @IsString() @MinLength(1) @MaxLength(200) capitulo: string;
  @IsIn(NIVELES) nivel: Nivel;
  @IsString() @MinLength(1) @MaxLength(2000) requisito: string;
  @IsOptional() @IsString() @MaxLength(2000) evidencia?: string;
  @IsOptional() @IsString() @MaxLength(300) referencia?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class ActualizarRequisitoDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20) codigo?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) capitulo?: string;
  @IsOptional() @IsIn(NIVELES) nivel?: Nivel;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(2000) requisito?: string;
  @IsOptional() @IsString() @MaxLength(2000) evidencia?: string;
  @IsOptional() @IsString() @MaxLength(300) referencia?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}

const CAMPOS: (keyof ActualizarRequisitoDto)[] = [
  'codigo',
  'capitulo',
  'nivel',
  'requisito',
  'evidencia',
  'referencia',
  'activo',
];

@Injectable()
export class RequisitosService {
  constructor(
    @InjectRepository(Requisito) private readonly repo: Repository<Requisito>,
    private readonly evidencias: EvidenciasService,
  ) {}

  async listar(soloActivos = false): Promise<Requisito[]> {
    const filas = await this.repo.find({ where: soloActivos ? { activo: true } : {} });
    return filas.sort((a, b) => (claveCodigo(a.codigo) < claveCodigo(b.codigo) ? -1 : 1));
  }

  async crear(dto: CrearRequisitoDto): Promise<Requisito> {
    const r = this.repo.create({
      codigo: dto.codigo.trim(),
      capitulo: dto.capitulo.trim(),
      nivel: dto.nivel,
      requisito: dto.requisito.trim(),
      evidencia: (dto.evidencia || '').trim(),
      referencia: (dto.referencia || '').trim(),
      activo: dto.activo ?? true,
    });
    return this.guardar(r);
  }

  async actualizar(id: string, dto: ActualizarRequisitoDto): Promise<Requisito> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Requisito no encontrado.');
    for (const campo of CAMPOS) {
      const v = dto[campo];
      if (v !== undefined) (r as any)[campo] = typeof v === 'string' ? v.trim() : v;
    }
    return this.guardar(r);
  }

  /** Elimina el requisito y, en cascada, sus respuestas y evidencias en todas las evaluaciones. */
  async eliminar(id: string): Promise<void> {
    if (!(await this.repo.exists({ where: { id } }))) throw new NotFoundException('Requisito no encontrado.');
    await this.evidencias.borrarArchivosDeRequisito(id);
    await this.repo.delete(id);
  }

  private async guardar(r: Requisito): Promise<Requisito> {
    try {
      return await this.repo.save(r);
    } catch (e) {
      if (esDuplicado(e)) throw new ConflictException(`El ítem ${r.codigo} ya existe. Usa otro código.`);
      throw e;
    }
  }
}

@Controller('requisitos')
export class RequisitosController {
  constructor(private readonly service: RequisitosService) {}

  @Get() listar(@Query('activos') activos?: string) {
    return this.service.listar(activos === 'true');
  }

  @Post() @Roles('admin') crear(@Body() dto: CrearRequisitoDto) {
    return this.service.crear(dto);
  }

  @Patch(':id') @Roles('admin') actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarRequisitoDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id') @Roles('admin') @HttpCode(204) async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.eliminar(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Requisito]), EvidenciasModule],
  controllers: [RequisitosController],
  providers: [RequisitosService],
})
export class RequisitosModule {}
