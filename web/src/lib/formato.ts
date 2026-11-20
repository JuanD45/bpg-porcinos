const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** 0.886 → "88,6 %" */
export function pct(x: number): string {
  return `${(Math.round(x * 1000) / 10).toLocaleString('es-CO')} %`;
}

/** 550000 → "$ 550.000" */
export function cop(n: number | null | undefined): string {
  return `$ ${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;
}

/** "2026-11-16" → "16 nov 2026" */
export function fecha(s: string | null | undefined): string {
  if (!s) return '—';
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${Number(d)} ${MESES[Number(m) - 1] || ''} ${y}`;
}

/** Fecha local de hoy en formato AAAA-MM-DD. */
export function hoyISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
