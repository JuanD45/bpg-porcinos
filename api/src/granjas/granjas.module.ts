import {
  Body,
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
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { CurrentUser, Roles, UsuarioSesion } from '../common/auth.decorators';
import { Evaluacion, Granja } from '../database/entities';
import { EvaluacionesModule, EvaluacionesService } from '../evaluaciones/evaluaciones.module';
import { EvidenciasModule, EvidenciasService } from '../evidencias/evidencias.module';

export class CrearGranjaDto {
  @IsString() @MinLength(1, { message: 'Escribe el nombre de la granja.' }) @MaxLength(200) nombre: string;
  @IsOptional() @IsString() @MaxLength(200) municipio?: string;
  @IsOptional() @IsString() @MaxLength(100) registroSanitario?: string;
  @IsOptional() @IsString() @MaxLength(200) asi?: string;
  @IsOptional() @IsString() @MaxLength(200) mvz?: string;
  @IsOptional() @IsString() @MaxLength(200) tipo?: string;
}

export class ActualizarGranjaDto {
  @IsOptional() @IsString() @MinLength(1, { message: 'Escribe el nombre de la granja.' }) @MaxLength(200)
  nombre?: string;
  @IsOptional() @IsString() @MaxLength(200) municipio?: string;
  @IsOptional() @IsString() @MaxLength(100) registroSanitario?: string;
  @IsOptional() @IsString() @MaxLength(200) asi?: string;
  @IsOptional() @IsString() @MaxLength(200) mvz?: string;
  @IsOptional() @IsString() @MaxLength(200) tipo?: string;
}

const CAMPOS: (keyof ActualizarGranjaDto)[] = ['nombre', 'municipio', 'registroSanitario', 'asi', 'mvz', 'tipo'];

@Injectable()
export class GranjasService {
  constructor(
    @InjectRepository(Granja) private readonly repo: Repository<Granja>,
    @InjectRepository(Evaluacion) private readonly evaluaciones: Repository<Evaluacion>,
    private readonly evaluacionesService: EvaluacionesService,
    private readonly evidencias: EvidenciasService,
  ) {}

  /** Granjas con el resumen de su evaluación más reciente. */
  async listar() {
    const granjas = await this.repo.find({ order: { nombre: 'ASC' } });
    const evals = await this.evaluaciones.find({ order: { fecha: 'DESC', creadoEn: 'DESC' } });
    const ultima = new Map<string, Evaluacion>();
    const conteo = new Map<string, number>();
    for (const e of evals) {
      if (!ultima.has(e.granjaId)) ultima.set(e.granjaId, e);
      conteo.set(e.granjaId, (conteo.get(e.granjaId) || 0) + 1);
    }
    const resumenes = await this.evaluacionesService.resumenes([...ultima.values()].map((e) => e.id));
    return granjas.map((g) => {
      const e = ultima.get(g.id);
      return {
        ...g,
        totalEvaluaciones: conteo.get(g.id) || 0,
        ultimaEvaluacion: e ? { id: e.id, fecha: e.fecha, resumen: resumenes.get(e.id) } : null,
      };
    });
  }

  async obtener(id: string): Promise<Granja> {
    const g = await this.repo.findOne({ where: { id } });
    if (!g) throw new NotFoundException('Granja no encontrada.');
    return g;
  }

  crear(dto: CrearGranjaDto, user: UsuarioSesion): Promise<Granja> {
    const g = this.repo.create({ creadoPorId: user.id });
    for (const c of CAMPOS) (g as any)[c] = ((dto as any)[c] || '').trim();
    return this.repo.save(g);
  }

  async actualizar(id: string, dto: ActualizarGranjaDto): Promise<Granja> {
    const g = await this.obtener(id);
    for (const c of CAMPOS) if (dto[c] !== undefined) (g as any)[c] = dto[c].trim();
    return this.repo.save(g);
  }

  /** Elimina la granja con sus evaluaciones, respuestas y archivos de evidencia. */
  async eliminar(id: string): Promise<void> {
    await this.obtener(id);
    const evals = await this.evaluaciones.find({ where: { granjaId: id }, select: { id: true } });
    await this.evidencias.borrarArchivosDeEvaluaciones(evals.map((e) => e.id));
    await this.repo.delete(id);
  }
}

@Controller('granjas')
export class GranjasController {
  constructor(private readonly service: GranjasService) {}

  @Get() listar() {
    return this.service.listar();
  }

  @Get(':id') obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post() @Roles('admin', 'auditor') crear(@Body() dto: CrearGranjaDto, @CurrentUser() user: UsuarioSesion) {
    return this.service.crear(dto, user);
  }

  @Patch(':id') @Roles('admin', 'auditor') actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarGranjaDto,
  ) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id') @Roles('admin') @HttpCode(204) async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.eliminar(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Granja, Evaluacion]), EvaluacionesModule, EvidenciasModule],
  controllers: [GranjasController],
  providers: [GranjasService],
})
export class GranjasModule {}
