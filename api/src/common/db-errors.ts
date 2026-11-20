/** true si el error de Postgres es una violación de restricción UNIQUE. */
export function esDuplicado(err: any): boolean {
  return err?.code === '23505' || err?.driverError?.code === '23505';
}
