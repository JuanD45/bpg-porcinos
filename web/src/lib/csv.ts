import type { Granja, Evaluacion, Requisito, Respuesta } from '../types';
import { prioridad } from './prioridad';

/** Descarga la evaluación como CSV (separado por ";" para Excel en español). */
export function descargarCSV(
  granja: Granja,
  evaluacion: Evaluacion,
  requisitos: Requisito[],
  respuestas: Map<string, Respuesta>,
) {
  const cab = [
    'Ítem', 'Capítulo', 'Referencia legal', 'Nivel', 'Requisito', 'Evidencia exigida', 'Estado', 'Prioridad',
    'Observaciones', 'Acción correctiva', 'Evidencia de cierre', 'Responsable', 'Fecha compromiso',
    'Inversión estimada', 'Avance', 'Evidencias adjuntas',
  ];
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [cab.map(q).join(';')];
  for (const r of requisitos) {
    const rs = respuestas.get(r.id);
    const estado = rs?.estado || 'PENDIENTE';
    const pr = prioridad(r.nivel, rs?.estado);
    filas.push(
      [
        r.codigo, r.capitulo, r.referencia, r.nivel, r.requisito, r.evidencia, estado, pr ? pr.texto : 'OK',
        rs?.observaciones, rs?.accion, rs?.evidenciaCierre, rs?.responsable, rs?.fechaCompromiso,
        rs?.inversion, rs?.avance, rs?.evidencias?.length || 0,
      ].map(q).join(';'),
    );
  }
  const nombre = `Evaluacion_BPG_${granja.nombre}_${evaluacion.fecha}`
    .normalize('NFD')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 90);
  const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${nombre}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
