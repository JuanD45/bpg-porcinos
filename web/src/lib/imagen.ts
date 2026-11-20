const LADO_MAX = 1920;
const TIPOS_DIRECTOS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Reduce las fotos grandes a 1920 px (JPEG 82 %) antes de subirlas.
 * Los PDF y las imágenes pequeñas se envían tal cual.
 */
export async function prepararArchivo(archivo: File): Promise<File> {
  if (archivo.type === 'application/pdf') return archivo;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo);
  } catch {
    throw new Error(`"${archivo.name}" no es un formato compatible. Usa JPG, PNG, WEBP o PDF.`);
  }
  const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
  if (escala === 1 && archivo.size < 1.5e6 && TIPOS_DIRECTOS.includes(archivo.type)) return archivo;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.82));
  if (!blob) throw new Error(`No se pudo procesar "${archivo.name}".`);
  const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], nombre, { type: 'image/jpeg' });
}
