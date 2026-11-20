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
  Put,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { In, Repository } from 'typeorm';
import { CurrentUser, Roles, UsuarioSesion } from '../common/auth.decorators';
import { calcularResumen, EstadoK, Resumen } from '../common/cumplimiento';
import { ConfiguracionModule, ConfiguracionService } from '../configuracion/configuracion.module';
import {
  Avance,
  AVANCES,
  Estado,
  ESTADOS,
  Evaluacion,
  Granja,
  Requisito,
  Respuesta,
} from '../database/entities';
import { EvidenciasModule, EvidenciasService, EvidenciaVista } from '../evidencias/evidencias.module';

export class CrearEvaluacionDto {
  @IsDateString({}, { message: 'La fecha debe tener formato AAAA-MM-DD.' }) fecha: string;
  @IsOptional() @IsString() @MaxLength(150) evaluador?: string;
}

export class ActualizarEvaluacionDto {
  @IsOptional() @IsDateString({}, { message: 'La fecha debe tener formato AAAA-MM-DD.' }) fecha?: string;
  @IsOptional() @IsString() @MaxLength(150) evaluador?: string;
}

/** Todos los campos son opcionales: solo se cambian los que llegan. Enviar null limpia el valor. */
export class GuardarRespuestaDto {
  @IsOptional() @IsIn(ESTADOS) estado?: Estado | null;
  @IsOptional() @IsString() @MaxLength(4000) observaciones?: string;
  @IsOptional() @IsString() @MaxLength(4000) accion?: string;
  @IsOptional() @IsString() @MaxLength(2000) evidenciaCierre?: string;
  @IsOptional() @IsString() @MaxLength(150) responsable?: string;
  @IsOptional() @IsDateString({}, { message: 'La fecha compromiso debe tener formato AAAA-MM-DD.' })
  fechaCompromiso?: string | null;
  @IsOptional() @IsNumber() @Min(0) @Max(999999999999) inversion?: number | null;
  @IsOptional() @IsIn(AVANCES) avance?: Avance | null;
}

const CAMPOS_RESPUESTA: (keyof GuardarRespuestaDto)[] = [
  'estado',
  'observaciones',
  'accion',
  'evidenciaCierre',
  'responsable',
  'fechaCompromiso',
  'inversion',
  'avance',
];

export type RespuestaVista = Respuesta & { evidencias: EvidenciaVista[] };
export type EvaluacionConResumen = Evaluacion & { resumen: Resumen };

@Injectable()
export class EvaluacionesService {
  constructor(
    @InjectRepository(Evaluacion) private readonly repo: Repository<Evaluacion>,
    @InjectRepository(Respuesta) private readonly respuestas: Repository<Respuesta>,
    @InjectRepository(Requisito) private readonly requisitos: Repository<Requisito>,
    @InjectRepository(Granja) private readonly granjas: Repository<Granja>,
    private readonly configuracion: ConfiguracionService,
    private readonly evidencias: EvidenciasService,
  ) {}

  /** Resumen de cumplimiento de varias evaluaciones, con el catálogo activo y las metas vigentes. */
  async resumenes(evaluacionIds: string[]): Promise<Map<string, Resumen>> {
    const mapa = new Map<string, Resumen>();
    if (!evaluacionIds.length) return mapa;
    const [reqs, umbrales, filas] = await Promise.all([
      this.requisitos.find({ where: { activo: true } }),
      this.configuracion.umbrales(),
      this.respuestas.find({
        where: { evaluacionId: In(evaluacionIds) },
        select: { evaluacionId: true, requisitoId: true, estado: true },
      }),
    ]);
    const estados = new Map<string, EstadoK>();
    for (const f of filas) estados.set(`${f.evaluacionId}|${f.requisitoId}`, f.estado);
    for (const id of evaluacionIds) {
      mapa.set(id, calcularResumen(reqs, (rid) => estados.get(`${id}|${rid}`), umbrales));
    }
    return mapa;
  }

  async listarPorGranja(granjaId: string): Promise<EvaluacionConResumen[]> {
    await this.exigirGranja(granjaId);
    const evals = await this.repo.find({ where: { granjaId }, order: { fecha: 'DESC', creadoEn: 'DESC' } });
    const res = await this.resumenes(evals.map((e) => e.id));
    return evals.map((e) => ({ ...e, resumen: res.get(e.id) }));
  }

  async crear(granjaId: string, dto: CrearEvaluacionDto, user: UsuarioSesion): Promise<EvaluacionConResumen> {
    await this.exigirGranja(granjaId);
    const e = await this.repo.save(
      this.repo.create({ granjaId, fecha: dto.fecha, evaluador: (dto.evaluador || '').trim(), creadoPorId: user.id }),
    );
    const res = await this.resumenes([e.id]);
    return { ...e, resumen: res.get(e.id) };
  }

  /** Evaluación completa: datos, granja y respuestas con sus evidencias. */
  async detalle(id: string) {
    const evaluacion = await this.exigir(id);
    const granja = await this.granjas.findOne({ where: { id: evaluacion.granjaId } });
    const filas = await this.respuestas.find({ where: { evaluacionId: id } });
    const evid = await this.evidencias.porRespuestas(filas.map((r) => r.id));
    const respuestas: RespuestaVista[] = filas.map((r) => ({ ...r, evidencias: evid.get(r.id) || [] }));
    return { evaluacion, granja, respuestas };
  }

  async actualizar(id: string, dto: ActualizarEvaluacionDto): Promise<Evaluacion> {
    const e = await this.exigir(id);
    if (dto.fecha !== undefined) e.fecha = dto.fecha;
    if (dto.evaluador !== undefined) e.evaluador = dto.evaluador.trim();
    return this.repo.save(e);
  }

  async eliminar(id: string): Promise<void> {
    await this.exigir(id);
    await this.evidencias.borrarArchivosDeEvaluaciones([id]);
    await this.repo.delete(id);
  }

  /** Crea o actualiza la respuesta de un requisito dentro de la evaluación. */
  async guardarRespuesta(
    evaluacionId: string,
    requisitoId: string,
    dto: GuardarRespuestaDto,
    user: UsuarioSesion,
  ): Promise<RespuestaVista> {
    await this.exigir(evaluacionId);
    if (!(await this.requisitos.exists({ where: { id: requisitoId } }))) {
      throw new NotFoundException('Requisito no encontrado.');
    }
    let r = await this.respuestas.findOne({ where: { evaluacionId, requisitoId } });
    if (!r) r = this.respuestas.create({ evaluacionId, requisitoId });
    for (const campo of CAMPOS_RESPUESTA) {
      if (dto[campo] !== undefined) (r as any)[campo] = dto[campo];
    }
    r.actualizadoPorId = user.id;
    const guardada = await this.respuestas.save(r);
    const evid = await this.evidencias.porRespuestas([guardada.id]);
    return { ...guardada, evidencias: evid.get(guardada.id) || [] };
  }

  private async exigir(id: string): Promise<Evaluacion> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Evaluación no encontrada.');
    return e;
  }

  private async exigirGranja(id: string) {
    if (!(await this.granjas.exists({ where: { id } }))) throw new NotFoundException('Granja no encontrada.');
  }
}

@Controller()
export class EvaluacionesController {
  constructor(private readonly service: EvaluacionesService) {}

  @Get('granjas/:granjaId/evaluaciones')
  listar(@Param('granjaId', ParseUUIDPipe) granjaId: string) {
    return this.service.listarPorGranja(granjaId);
  }

  @Post('granjas/:granjaId/evaluaciones')
  @Roles('admin', 'auditor')
  crear(
    @Param('granjaId', ParseUUIDPipe) granjaId: string,
    @Body() dto: CrearEvaluacionDto,
    @CurrentUser() user: UsuarioSesion,
  ) {
    return this.service.crear(granjaId, dto, user);
  }

  @Get('evaluaciones/:id')
  detalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detalle(id);
  }

  @Patch('evaluaciones/:id')
  @Roles('admin', 'auditor')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarEvaluacionDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete('evaluaciones/:id')
  @Roles('admin', 'auditor')
  @HttpCode(204)
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.eliminar(id);
  }

  @Put('evaluaciones/:id/respuestas/:requisitoId')
  @Roles('admin', 'auditor')
  guardarRespuesta(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requisitoId', ParseUUIDPipe) requisitoId: string,
    @Body() dto: GuardarRespuestaDto,
    @CurrentUser() user: UsuarioSesion,
  ) {
    return this.service.guardarRespuesta(id, requisitoId, dto, user);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluacion, Respuesta, Requisito, Granja]),
    ConfiguracionModule,
    EvidenciasModule,
  ],
  controllers: [EvaluacionesController],
  providers: [EvaluacionesService],
  exports: [EvaluacionesService],
})
export class EvaluacionesModule {}
