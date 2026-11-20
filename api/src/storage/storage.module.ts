import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Global,
  Injectable,
  Logger,
  Module,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHmac, timingSafeEqual } from 'crypto';
import { createReadStream, existsSync, promises as fs } from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { Public } from '../common/auth.decorators';

const DURACION_URL_SEG = 60 * 60; // los enlaces a evidencias valen 1 hora
const CLAVE_VALIDA = /^[A-Za-z0-9._\-\/]+$/;

/**
 * Guarda y entrega las evidencias (fotos y PDF).
 * - STORAGE_DRIVER=s3: Amazon S3 o compatible; se entregan con URL firmada.
 * - STORAGE_DRIVER=local: disco del servidor; se entregan por /api/archivos con firma HMAC.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger('Storage');
  private readonly driver: 'local' | 's3';
  private readonly bucket: string;
  private readonly s3: S3Client;
  private readonly s3Publico: S3Client;
  private readonly dir: string;
  private readonly secreto: string;
  private readonly baseApi: string;

  constructor(config: ConfigService) {
    this.driver = config.get('STORAGE_DRIVER') === 's3' ? 's3' : 'local';
    this.secreto = config.getOrThrow<string>('JWT_SECRET');
    this.baseApi = (config.get<string>('PUBLIC_API_URL') || '').replace(/\/$/, '');
    this.dir = path.resolve(config.get<string>('STORAGE_LOCAL_DIR') || './uploads');

    if (this.driver === 's3') {
      this.bucket = config.getOrThrow<string>('S3_BUCKET');
      const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
      const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
      const base = {
        region: config.get<string>('S3_REGION') || 'us-east-1',
        forcePathStyle: config.get('S3_FORCE_PATH_STYLE') === 'true',
        credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      };
      const endpoint = config.get<string>('S3_ENDPOINT') || undefined;
      const endpointPublico = config.get<string>('S3_PUBLIC_ENDPOINT') || endpoint;
      this.s3 = new S3Client({ ...base, endpoint });
      this.s3Publico = new S3Client({ ...base, endpoint: endpointPublico });
      this.logger.log(`Evidencias en S3, bucket "${this.bucket}"`);
    } else {
      this.logger.log(`Evidencias en disco local: ${this.dir}`);
    }
  }

  async guardar(clave: string, contenido: Buffer, contentType: string): Promise<void> {
    if (this.driver === 's3') {
      await this.s3.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: clave, Body: contenido, ContentType: contentType }),
      );
      return;
    }
    const destino = this.rutaLocal(clave);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, contenido);
  }

  async eliminar(clave: string): Promise<void> {
    try {
      if (this.driver === 's3') {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: clave }));
      } else {
        await fs.rm(this.rutaLocal(clave), { force: true });
      }
    } catch (e: any) {
      this.logger.warn(`No se pudo eliminar ${clave}: ${e?.message}`);
    }
  }

  /** URL temporal para ver o descargar el archivo. */
  async url(clave: string): Promise<string> {
    if (this.driver === 's3') {
      return getSignedUrl(this.s3Publico, new GetObjectCommand({ Bucket: this.bucket, Key: clave }), {
        expiresIn: DURACION_URL_SEG,
      });
    }
    const exp = Math.floor(Date.now() / 1000) + DURACION_URL_SEG;
    const q = new URLSearchParams({ clave, exp: String(exp), firma: this.firmar(clave, exp) });
    return `${this.baseApi}/api/archivos?${q.toString()}`;
  }

  // ----- solo modo local -----
  firmar(clave: string, exp: number): string {
    return createHmac('sha256', this.secreto).update(`${clave}:${exp}`).digest('base64url');
  }

  verificar(clave: string, exp: number, firma: string): boolean {
    if (!clave || !firma || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
    const esperada = Buffer.from(this.firmar(clave, exp));
    const recibida = Buffer.from(firma);
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  }

  rutaLocal(clave: string): string {
    if (!CLAVE_VALIDA.test(clave) || clave.includes('..')) throw new BadRequestException('Clave de archivo inválida.');
    const ruta = path.resolve(this.dir, clave);
    if (!ruta.startsWith(this.dir + path.sep)) throw new BadRequestException('Clave de archivo inválida.');
    return ruta;
  }
}

const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

/** Entrega archivos del modo local. El enlace firmado reemplaza al token de sesión. */
@Controller('archivos')
export class ArchivosController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get()
  servir(
    @Query('clave') clave: string,
    @Query('exp') exp: string,
    @Query('firma') firma: string,
    @Res() res: Response,
  ) {
    if (!this.storage.verificar(clave, Number(exp), firma)) {
      throw new ForbiddenException('El enlace no es válido o ya venció. Recarga la página.');
    }
    const ruta = this.storage.rutaLocal(clave);
    if (!existsSync(ruta)) throw new NotFoundException('Archivo no encontrado.');
    res.setHeader('Content-Type', TIPOS[path.extname(ruta).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    createReadStream(ruta).pipe(res);
  }
}

@Global()
@Module({
  controllers: [ArchivosController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
