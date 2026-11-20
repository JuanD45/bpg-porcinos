import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Carga los 45 requisitos de la lista de chequeo ICA BPG (Res. 76509/2020),
 * las metas mínimas por nivel y una granja de ejemplo con su autoevaluación.
 */
export class DatosIniciales1763600000001 implements MigrationInterface {
  name = 'DatosIniciales1763600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
INSERT INTO configuracion (clave, valor) VALUES ('umbrales', '{"F": 1, "My": 0.8, "Mn": 0.6}');

INSERT INTO requisitos (codigo, capitulo, referencia, nivel, requisito, evidencia) VALUES
('1.1', '1. Requisitos Documentales y Trazabilidad Base', 'Res. 76509/20 Art. 4.1; Res. 115708/21', 'F', 'Inscripción del predio (RSPP/ISPP) y Autorización Sanitaria y de Inocuidad (ASI).', 'Certificado RSPP/ISPP activo ante oficina local ICA y resolución/constancia ASI vigente.'),
('1.2', '1. Requisitos Documentales y Trazabilidad Base', 'Res. 76509/20 Art. 4.2', 'F', 'Acreditación legal del titular y tenencia del predio porcícola.', 'Cédula o Cámara de Comercio vigente y certificado de tradición, contrato de arriendo o documento de tenencia.'),
('1.3', '1. Requisitos Documentales y Trazabilidad Base', 'Res. 76509/20 Art. 4.3', 'F', 'Asistencia técnica permanente de Médico Veterinario (MV) o MVZ.', 'Contrato o constancia de vinculación del MV/MVZ y copia de Tarjeta Profesional vigente.'),
('1.4', '1. Requisitos Documentales y Trazabilidad Base', 'Res. 76509/20 Art. 4.4', 'My', 'Archivo histórico de registros sanitarios, productivos y de limpieza (mínimo 2 años).', 'Carpetas físicas o sistema digital respaldado con mínimo 24 meses de historial trazable.'),
('1.5', '1. Requisitos Documentales y Trazabilidad Base', 'Res. 76509/20 Art. 5.3.10', 'Mn', 'Señalización e identificación visible de todas las áreas de la granja.', 'Avisos legibles en entrada, cuarentena, gestación, maternidad, enfermería, bodegas, embarque y compostaje.'),
('2.1', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.1.1', 'F', 'Plan sanitario documentado y suscrito por el MV/MVZ responsable.', 'Documento vigente con prevención y control de enfermedades endémicas, parasitarias y esquema de vacunación.'),
('2.2', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.1.2; Res. 18426/25', 'F', 'Protocolo de notificación obligatoria inmediata al ICA (< 24 horas).', 'Procedimiento visible y conocimiento del personal para reportar muertes inusuales o cuadros vesiculares/hemorrágicos.'),
('2.3', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.1.3; Res. 100334/21', 'F', 'Cumplimiento del estatus sanitario oficial de Peste Porcina Clásica (PPC) y Aujeszky.', 'Certificados de vacunación oficial (si aplica a zona) o controles de zona libre sin vacunación y chapeteo oficial.'),
('2.4', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.1.4', 'My', 'Registros de eventos sanitarios, diagnósticos de laboratorio y necropsias.', 'Bitácora de hallazgos clínicos, resultados de laboratorio veterinario y actas de necropsia.'),
('2.5', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.1.5', 'My', 'Área o corral de enfermería / aislamiento sanitario debidamente señalizado.', 'Corral exclusivo, separado del flujo normal, con comederos/bebederos propios para aislar enfermos.'),
('2.6', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.2.1', 'My', 'Identificación única e individual de todos los animales reproductores (pie de cría).', '100% de hembras de cría (PIC 1020/1050) y machos con chapeta/arete legible e individual.'),
('2.7', '2. Sanidad Animal y Vigilancia Epidemiológica', 'Res. 76509/20 Art. 5.2.2', 'My', 'Sistema de identificación por lotes de producción y tarjetas de maternidad/gestación.', 'Tarjetas individuales en jaulas de maternidad/gestación y trazabilidad por banda semanal.'),
('3.1', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.1', 'F', 'Cerco perimetral completo y control de puertas de acceso a la unidad productiva.', 'Cercas, mallas y broches íntegros que impidan el paso de personas, vehículos y animales externos.'),
('3.2', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.2', 'F', 'Sistema funcional de lavado y desinfección de vehículos en el ingreso perimetral.', 'Arco o bomba de aspersión activa, desinfectante con Registro ICA, protocolo y bitácora de vehículos.'),
('3.3', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.3', 'F', 'Filtro sanitario de personas (duchas/lavado, cambio de ropa y calzado, registro).', 'Zona sucia/limpia separada, ducha obligatoria, dotación exclusiva de granja y libro de visitantes.'),
('3.4', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.4', 'My', 'Pediluvios activos y protocolo de desinfección de herramientas y equipos.', 'Pocetas/pediluvios con desinfectante limpio a la entrada de cada sala (maternidad, gestación) y cámara UV/desinfección.'),
('3.5', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.5', 'F', 'Protocolo de ingreso de reemplazos y semen con Guía Sanitaria de Movilización (GSMI).', 'Compras exclusivas a granjas/postas PIC registradas ante ICA, certificaciones sanitarias y archivo de GSMI.'),
('3.6', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.6', 'F', 'Área de cuarentena aislada físicamente para aclimatación de reemplazos (21-30 días).', 'Instalación separada de la granja comercial, con personal/botas exclusivas, protocolo y registros de cuarentena.'),
('3.7', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.7', 'My', 'Zona de embarque y desembarque ubicada en el perímetro de la granja.', 'Embarcadero perimetral que evita que camiones externos de destete o descarte entren a zona limpia.'),
('3.8', '3. Bioseguridad Externa e Interna', 'Res. 76509/20 Art. 5.3.8', 'F', 'Prohibición de ingreso/consumo de carne de cerdo y tenencia de cerdos por operarios.', 'Actas individuales firmadas por 100% del personal y avisos de prohibición en comedor y portería.'),
('4.1', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.1', 'F', 'Uso exclusivo de medicamentos veterinarios, biológicos y desinfectantes con Registro ICA.', 'Inspección visual de bodega y nevera: 100% de productos con número de Registro ICA legible.'),
('4.2', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.2', 'F', 'Ausencia total de medicamentos o biológicos vencidos o con alteraciones físicas.', 'Revisión de fechas de expiración en estantería, nevera y carros de maternidad.'),
('4.3', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.3', 'My', 'Almacenamiento seguro, clasificado y separado de fármacos veterinarios.', 'Bodega exclusiva bajo llave, limpia, seca, protegida de luz, clasificada y separada de alimentos/plaguicidas.'),
('4.4', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.4', 'F', 'Cadena de frío de biológicos y semen: nevera exclusiva y registro diario de temperatura.', 'Refrigerador exclusivo con termómetro calibrado y planilla diaria (2°C a 8°C biológicos; 16-18°C semen).'),
('4.5', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.5 - 6.7', 'F', 'Prohibición de sustancias prohibidas por el ICA y materias primas químicas puras.', 'Cero presencia de cloranfenicol, nitrofuranos, olaquindox, violeta de genciana o principios activos puros.'),
('4.6', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.6', 'F', 'Prescripción escrita (fórmula médica) del MV/MVZ para antibióticos, hormonales y control especial.', 'Archivo de fórmulas veterinarias firmadas con TP del MVZ conservadas por mínimo 2 años.'),
('4.7', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.8', 'F', 'Registro escrito de tratamientos veterinarios y respeto estricto del tiempo de retiro.', 'Planilla con fecha, ID animal/lote, producto, dosis, vía, responsable y días de retiro verificados antes de venta.'),
('4.8', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.9', 'My', 'Uso de agujas y jeringas desechables/estériles y equipos dosificadores limpios.', 'Prohibido guardar fármacos en jeringas; cambio de aguja por camada/cerda; pistolas dosificadoras limpias.'),
('4.9', '4. Buenas Prácticas Uso Medicamentos Veterinarios (BPMV)', 'Res. 76509/20 Art. 6.10', 'My', 'Gestión y disposición final de envases vacíos, medicamentos vencidos y cortopunzantes.', 'Guardianes rígidos para agujas, bolsa roja para biosanitarios y certificado de recolección gestor autorizado.'),
('5.1', '5. Buenas Prácticas Alimentación Animal (BPAA) y Agua', 'Res. 76509/20 Art. 7.1', 'F', 'Uso exclusivo de alimentos balanceados, pre-iniciadores y suplementos con Registro ICA.', 'Etiquetas/rotulados y facturas de planta de alimentos balanceados con Registro ICA vigente.'),
('5.2', '5. Buenas Prácticas Alimentación Animal (BPAA) y Agua', 'Res. 76509/20 Art. 7.2', 'F', 'Prohibición absoluta de suministrar lavazas o desperdicios de alimentación humana.', 'Verificación física de cocinas/comederos y declaración de no uso de residuos orgánicos humanos o cárnicos.'),
('5.3', '5. Buenas Prácticas Alimentación Animal (BPAA) y Agua', 'Res. 76509/20 Art. 7.3', 'My', 'Almacenamiento higiénico de alimentos en bodega y silos.', 'Bultos sobre estibas y separados de paredes; bodega libre de humedad/plagas; silos sellados sin goteras.'),
('5.4', '5. Buenas Prácticas Alimentación Animal (BPAA) y Agua', 'Res. 76509/20 Art. 7.4', 'My', 'Trazabilidad de inventarios de alimento y control de alimento medicado.', 'Kardex PEPS con lote y fecha; si se usa alimento medicado, contar con prescripción escrita del MVZ.'),
('5.5', '5. Buenas Prácticas Alimentación Animal (BPAA) y Agua', 'Res. 76509/20 Art. 7.5; Res. 115708/21', 'F', 'Calidad del agua de bebida: análisis fisicoquímico y microbiológico anual + limpieza de tanques.', 'Resultados de laboratorio acreditado (mínimo 1 vez/año, últimos 2 años archivados) y registro lavado tanques.'),
('6.1', '6. Saneamiento Básico y Manejo Ambiental', 'Res. 76509/20 Art. 8.1', 'My', 'Procedimiento y registros de limpieza y desinfección de salas, equipos y utensilios.', 'POES documentado y planillas de lavado, desinfección y vacío sanitario de salas de maternidad.'),
('6.2', '6. Saneamiento Básico y Manejo Ambiental', 'Res. 76509/20 Art. 8.2', 'My', 'Programa integrado de control de plagas (roedores e insectos) y control de malezas.', 'Mapa de cebaderos, registros de monitoreo, fichas técnicas de rodenticidas con Registro ICA y perímetro desyerbado.'),
('6.3', '6. Saneamiento Básico y Manejo Ambiental', 'Res. 76509/20 Art. 8.3', 'F', 'Disposición sanitaria de mortalidades, placentas y tejidos.', 'Compostaje técnico cerrado/techado o incineración sin acceso de perros, aves carroñeras ni lixiviados.'),
('6.4', '6. Saneamiento Básico y Manejo Ambiental', 'Res. 76509/20 Art. 8.4', 'F', 'Manejo sanitario de porquinaza sólida y líquida y residuos ordinarios.', 'Estercolero, biodigestor o sistema de tratamiento funcional sin vertimientos directos a fuentes de agua.'),
('7.1', '7. Bienestar Animal (Res. 136/2020 y Res. 16409/2024)', 'Res. 76509/20 Art. 9.1; Res. 136/20', 'My', 'Instalaciones, pisos antideslizantes, drenaje y áreas mínimas libres por categoría.', 'Pisos sin salientes cortantes, drenaje activo y cumplimiento de m² mínimos en corrales de gestación/reemplazos.'),
('7.2', '7. Bienestar Animal (Res. 136/2020 y Res. 16409/2024)', 'Res. 76509/20 Art. 9.1.4; Res. 136/20', 'My', 'Confort térmico y ventilación: fuentes de calor para lechones en maternidad (30-32°C).', 'Lámparas/placas térmicas funcionando en lechoneras; ausencia de amontonamiento/temblor en lechones o jadeo en cerdas.'),
('7.3', '7. Bienestar Animal (Res. 136/2020 y Res. 16409/2024)', 'Res. 76509/20 Art. 9.1.5; Res. 136/20', 'My', 'Suministro permanente de agua limpia con aforo correcto y comederos suficientes.', 'Aforo verificado: 1,5-2,0 L/min cerdas lactantes/gestantes; 0,3 L/min lechones; bebederos a altura del lomo.'),
('7.4', '7. Bienestar Animal (Res. 136/2020 y Res. 16409/2024)', 'Res. 76509/20 Art. 9.1.7; Res. 136/20', 'My', 'Prácticas de manejo sin dolor innecesario ni maltrato animal.', 'Prohibición de muescas en orejas, hierro caliente y tábanos eléctricos; castración >7 días solo con anestesia/analgesia MV.'),
('8.1', '8. Personal, Capacitación y Transporte', 'Res. 76509/20 Art. 9.2.1; Res. 136/20', 'My', 'Capacitación del personal en BPG, bioseguridad, bienestar animal y manejo de fármacos.', 'Certificados de capacitación en bienestar animal vigentes (vigencia 5 años) y actas de entrenamiento interno.'),
('8.2', '8. Personal, Capacitación y Transporte', 'Res. 76509/20 Art. 9.2.2', 'My', 'Salud ocupacional, seguridad social, dotación EPP y botiquín de primeros auxilios.', 'Certificado médico anual de manipuladores, afiliación ARL/EPS vigente, EPP completos y botiquín dotado.'),
('8.3', '8. Personal, Capacitación y Transporte', 'Res. 76509/20 Art. 10', 'My', 'Condiciones de transporte de animales en pie (vehículos autorizados, limpieza y GSMI).', 'Verificación de limpieza/desinfección previa, pisos antideslizantes, densidad y GSMI (si usa flota propia).');

INSERT INTO granjas (id, nombre, municipio, registro_sanitario, asi, mvz, tipo) VALUES ('6f1c2a7e-0d3b-4c51-9a8e-3b2f5d7c9e10', 'Granja Porcícola de Cría La Victoria (ejemplo)', 'La Victoria, Valle del Cauca', 'RSPP-76-XXX-2026', 'Vigente (Res. 115708/2021)', 'Dr. Responsable Sanitario (TP vigente)', 'Cría · Genética PIC 337 x 1020/1050');

INSERT INTO evaluaciones (id, granja_id, fecha, evaluador) VALUES ('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', '6f1c2a7e-0d3b-4c51-9a8e-3b2f5d7c9e10', '2026-11-16', 'Autoevaluación interna');

INSERT INTO respuestas (evaluacion_id, requisito_id, estado, observaciones, accion, evidencia_cierre, responsable, fecha_compromiso, inversion, avance) VALUES
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '1.1'), 'CUMPLE', 'Documentación en regla y archivada en oficina de granja.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '1.2'), 'CUMPLE', 'Carpeta legal actualizada.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '1.3'), 'CUMPLE', 'MVZ realiza visita semanal y firma plan sanitario.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '1.4'), 'CUMPLE', 'Registros archivados desde 2024.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '1.5'), 'CUMPLE', 'Señalética instalada en todos los galpones.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.1'), 'CUMPLE', 'Plan sanitario 2026 firmado por MVZ.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.2'), 'CUMPLE', 'Números de oficina local ICA visibles en cartelera.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.3'), 'CUMPLE', 'Predio en zona libre de PPC sin vacunación; ingreso controlado.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.4'), 'CUMPLE', 'Bitácora sanitaria al día.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.5'), 'CUMPLE', 'Corral de enfermería señalizado en gestación.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.6'), 'CUMPLE', 'Doble chapeteo en hembras de reemplazo y cría.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '2.7'), 'CUMPLE', 'Tarjetas de sala y software/Excel de lotes activos.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.1'), 'CUMPLE', 'Cerco perimetral revisado sin brechas.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.2'), 'CUMPLE', 'Bomba estacionaria y planilla en portería.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.3'), 'CUMPLE', 'Filtro sanitario operativo con ducha y dotación.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.4'), 'CUMPLE', 'Pediluvios con recambio cada 48 horas.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.5'), 'CUMPLE', 'GSMI y certificados sanitarios PIC archivados.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.6'), 'CUMPLE', 'Cuarentena a 150 m de salas de cría con flujo independiente.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.7'), 'CUMPLE', 'Embarcadero perimetral funcional.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '3.8'), 'NO CUMPLE', 'Faltan actas firmadas de 2 operarios nuevos ingresados este mes.', 'Socializar protocolo de bioseguridad en inducción y recoger actas firmadas con huella/cédula.', 'Actas individuales firmadas archivadas en carpeta de bioseguridad.', 'Administrador Granja', '2026-11-20', '0', 'En ejecución'),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.1'), 'CUMPLE', 'Inventario verificado con registro ICA.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.2'), 'CUMPLE', 'Sistema semaforizado de vencimientos en bodega.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.3'), 'CUMPLE', 'Bodega exclusiva con estantería plástica.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.4'), 'NO CUMPLE', 'Falta registro de temperatura de los últimos 4 fines de semana.', 'Designar responsable de turno fin de semana e instalar termómetro digital con alarma máxima/mínima.', 'Planilla diaria de temperatura (2°C-8°C) diligenciada al 100% sin espacios en blanco.', 'Médico Veterinario (MVZ)', '2026-11-22', '85000', 'En ejecución'),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.5'), 'CUMPLE', 'Cumplimiento total verificado.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.6'), 'CUMPLE', 'Fórmulas archivadas junto a facturas de compra.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.7'), 'CUMPLE', 'Registro actualizado en maternidad y gestación.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.8'), 'CUMPLE', 'Protocolo de 1 aguja por camada implementado.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '4.9'), 'CUMPLE', 'Certificado de gestor autorizado vigente.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '5.1'), 'CUMPLE', 'Alimento comercial con registro ICA.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '5.2'), 'CUMPLE', '100% dieta balanceada comercial.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '5.3'), 'CUMPLE', 'Estibas plásticas y silos revisados.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '5.4'), 'CUMPLE', 'Kardex de bodega actualizado.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '5.5'), 'NO CUMPLE', 'Último análisis de laboratorio tiene 14 meses (vencido por 2 meses).', 'Tomar muestra de agua en punto de consumo de maternidad/gestación y enviar a laboratorio acreditado IDEAM/ONAC.', 'Informe de resultados de laboratorio vigente archivado junto al histórico del año anterior.', 'Administrador / MVZ', '2026-11-25', '420000', 'Pendiente'),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '6.1'), 'CUMPLE', 'Planillas de lavado entre lotes de maternidad al día.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '6.2'), 'CUMPLE', 'Mapa de estaciones cebaderas y monitoreo quincenal.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '6.3'), 'CUMPLE', 'Cajones de compostaje techados y con registro de temperatura.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '6.4'), 'CUMPLE', 'Sistema de separación de sólidos y laguna/estercolero operativo.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '7.1'), 'CUMPLE', 'Pisos en slat y concreto ranurado en buen estado.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '7.2'), 'CUMPLE', 'Lámparas infrarrojas y cortinas regulables en maternidad.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '7.3'), 'NO CUMPLE', '3 chupos en maternidad B con presión baja (1,1 L/min); requieren mantenimiento.', 'Desmontar, limpiar filtros/mallas de los chupos y regular presión de línea de maternidad.', 'Registro de aforo cronometrado (>1,5 L/min en cerdas lactantes) verificado por jefe de sala.', 'Jefe Maternidad / Mant.', '2026-11-19', '45000', 'Cerrado'),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '7.4'), 'CUMPLE', 'Identificación por chapeta; uso de tablas de manejo.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '8.1'), 'NO CUMPLE', 'Certificado de bienestar animal del jefe de maternidad vencido; programar curso SENA/ICA.', 'Inscribir al personal pendiente en curso certificado de Bienestar Animal en Porcinos (SENA / Porkcolombia / ICA).', 'Certificado de aprobación vigente (5 años) archivado en hoja de vida.', 'Administrador Granja', '2026-12-05', '0', 'Pendiente'),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '8.2'), 'CUMPLE', 'Exámenes médicos ocupacionales y ARL vigentes.', '', '', '', NULL, NULL, NULL),
('a2b4c6d8-1e3f-4a5b-8c7d-9e0f1a2b3c4d', (SELECT id FROM requisitos WHERE codigo = '8.3'), 'NO APLICA', 'Granja terceriza 100% del transporte con compradores autorizados en embarcadero.', '', '', '', NULL, NULL, NULL);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM granjas WHERE id = '6f1c2a7e-0d3b-4c51-9a8e-3b2f5d7c9e10'`);
    await queryRunner.query(`DELETE FROM requisitos`);
    await queryRunner.query(`DELETE FROM configuracion WHERE clave = 'umbrales'`);
  }
}
