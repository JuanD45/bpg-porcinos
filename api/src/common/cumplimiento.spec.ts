import { calcularResumen, claveCodigo, RequisitoMin } from './cumplimiento';

const req = (id: string, nivel: 'F' | 'My' | 'Mn', capitulo = 'C1'): RequisitoMin => ({
  id,
  codigo: id,
  capitulo,
  nivel,
});

describe('calcularResumen', () => {
  it('excluye los "no aplica" del denominador', () => {
    const reqs = [req('1.1', 'My'), req('1.2', 'My'), req('1.3', 'My')];
    const estados = { '1.1': 'CUMPLE', '1.2': 'NO APLICA', '1.3': 'NO CUMPLE' } as const;
    const r = calcularResumen(reqs, (id) => estados[id]);
    const my = r.niveles.find((n) => n.nivel === 'My');
    expect(my.pct).toBeCloseTo(0.5);
    expect(my.cumpleMeta).toBe(false);
  });

  it('no es certificable si falla un solo fundamental', () => {
    const reqs = [req('1.1', 'F'), req('1.2', 'F'), req('2.1', 'My'), req('3.1', 'Mn')];
    const estados = { '1.1': 'CUMPLE', '1.2': 'NO CUMPLE', '2.1': 'CUMPLE', '3.1': 'CUMPLE' } as const;
    const r = calcularResumen(reqs, (id) => estados[id]);
    expect(r.certificable).toBe(false);
    expect(r.total.pct).toBeCloseTo(0.75);
  });

  it('cuenta los ítems sin calificar como pendientes', () => {
    const r = calcularResumen([req('1.1', 'F'), req('1.2', 'Mn')], () => null);
    expect(r.pendientes).toBe(2);
  });

  it('ordena códigos numéricamente', () => {
    expect(claveCodigo('1.10') > claveCodigo('1.9')).toBe(true);
  });
});
