import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, Repository } from 'typeorm';
import { CurrentUser, Roles, UsuarioSesion } from '../common/auth.decorators';
import { Evaluacion, Evidencia, Requisito, Respuesta } from '../database/entities';
import { StorageService } from '../storage/storage.module';

const TAMANO_MAX = 20 * 1024 * 1024;
const EXTENSIONES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

export interface EvidenciaVista {
  id: string;
  respuestaId: string;
  nombreArchivo: string;
  contentType: string;
  tamano: number;
  subidoPorId: string | null;
  creadoEn: Date;
  url: string;
}

@Injectable()
export class EvidenciasService {
  constructor(
    @InjectRepository(Evidencia) private readonly repo: Repository<Evidencia>,
    @InjectRepository(Respuesta) private readonly respuestas: Repository<Respuesta>,
    @InjectRepository(Evaluacion) private readonly evaluaciones: Repository<Evaluacion>,
    @InjectRepository(Requisito) private readonly requisitos: Repository<Requisito>,
    private readonly storage: StorageService,
  ) {}

  async vista(e: Evidencia): Promise<EvidenciaVista> {
    return {
      id: e.id,
      respuestaId: e.respuestaId,
      nombreArchivo: e.nombreArchivo,
      contentType: e.contentType,
      tamano: e.tamano,
      subidoPorId: e.subidoPorId,
      creadoEn: e.creadoEn,
      url: await this.storage.url(e.claveArchivo),
    };
  }

  /** Evidencias agrupadas por respuesta, con su URL temporal. */
  async porRespuestas(respuestaIds: string[]): Promise<Map<string, EvidenciaVista[]>> {
    const mapa = new Map<string, EvidenciaVista[]>();
    if (!respuestaIds.length) return mapa;
    const filas = await this.repo.find({ where: { respuestaId: In(respuestaIds) }, order: { creadoEn: 'ASC' } });
    for (const e of filas) {
      const lista = mapa.get(e.respuestaId) || [];
      lista.push(await this.vista(e));
      mapa.set(e.respuestaId, lista);
    }
    return mapa;
  }

  async subir(
    evaluacionId: string,
    requisitoId: string,
    archivos: Express.Multer.File[],
    user: UsuarioSesion,
  ): Promise<EvidenciaVista[]> {
    if (!archivos?.length) throw new BadRequestException('Adjunta al menos un archivo.');
    for (const a of archivos) {
      if (!EXTENSIONES[a.mimetype]) {
        throw new BadRequestException(`"${a.originalname}" no es compatible. Usa JPG, PNG, WEBP o PDF.`);
      }
      if (a.size > TAMANO_MAX) throw new BadRequestException(`"${a.originalname}" supera 20 MB.`);
    }
    if (!(await this.evaluaciones.exists({ where: { id: evaluacionId } }))) {
      throw new NotFoundException('Evaluación no encontrada.');
    }
    if (!(await this.requisitos.exists({ where: { id: requisitoId } }))) {
      throw new NotFoundException('Requisito no encontrado.');
    }

    let respuesta = await this.respuestas.findOne({ where: { evaluacionId, requisitoId } });
    if (!respuesta) {
      respuesta = await this.respuestas.save(
        this.respuestas.create({ evaluacionId, requisitoId, actualizadoPorId: user.id }),
      );
    }

    const creadas: EvidenciaVista[] = [];
    for (const a of archivos) {
      const clave = `evaluaciones/${evaluacionId}/${requisitoId}/${randomUUID()}${EXTENSIONES[a.mimetype]}`;
      await this.storage.guardar(clave, a.buffer, a.mimetype);
      const fila = await this.repo.save(
        this.repo.create({
          respuestaId: respuesta.id,
          claveArchivo: clave,
          nombreArchivo: (a.originalname || 'evidencia').slice(0, 200),
          contentType: a.mimetype,
          tamano: a.size,
          subidoPorId: user.id,
        }),
      );
      creadas.push(await this.vista(fila));
    }
    return creadas;
  }

  async eliminar(id: string, user: UsuarioSesion): Promise<void> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Evidencia no encontrada.');
    if (user.rol !== 'admin' && e.subidoPorId !== user.id) {
      throw new ForbiddenException('Solo quien subió la evidencia o un administrador puede eliminarla.');
    }
    await this.storage.eliminar(e.claveArchivo);
    await this.repo.delete(id);
  }

  /** Borra del almacenamiento los archivos de estas evaluaciones (antes de borrar las filas). */
  async borrarArchivosDeEvaluaciones(evaluacionIds: string[]): Promise<void> {
    if (!evaluacionIds.length) return;
    const claves: { clave: string }[] = await this.repo
      .createQueryBuilder('e')
      .innerJoin(Respuesta, 'r', 'r.id = e.respuestaId')
      .select('e.claveArchivo', 'clave')
      .where('r.evaluacionId IN (:...ids)', { ids: evaluacionIds })
      .getRawMany();
    for (const { clave } of claves) await this.storage.eliminar(clave);
  }

  async borrarArchivosDeRequisito(requisitoId: string): Promise<void> {
    const claves: { clave: string }[] = await this.repo
      .createQueryBuilder('e')
      .innerJoin(Respuesta, 'r', 'r.id = e.respuestaId')
      .select('e.claveArchivo', 'clave')
      .where('r.requisitoId = :id', { id: requisitoId })
      .getRawMany();
    for (const { clave } of claves) await this.storage.eliminar(clave);
  }
}

@Controller()
export class EvidenciasController {
  constructor(private readonly service: EvidenciasService) {}

  @Post('evaluaciones/:id/respuestas/:requisitoId/evidencias')
  @Roles('admin', 'auditor')
  @UseInterceptors(FilesInterceptor('archivos', 10, { limits: { fileSize: TAMANO_MAX } }))
  subir(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requisitoId', ParseUUIDPipe) requisitoId: string,
    @UploadedFiles() archivos: Express.Multer.File[],
    @CurrentUser() user: UsuarioSesion,
  ) {
    return this.service.subir(id, requisitoId, archivos, user);
  }

  @Delete('evidencias/:id')
  @Roles('admin', 'auditor')
  @HttpCode(204)
  async eliminar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UsuarioSesion) {
    await this.service.eliminar(id, user);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Evidencia, Respuesta, Evaluacion, Requisito])],
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
  exports: [EvidenciasService],
})
export class EvidenciasModule {}
