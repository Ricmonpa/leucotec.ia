// ---------------------------------------------------------------------------
// Qué se consume al aplicar una dosis.
//
// Sale del desglose de insumos del cotizador de Leucotec. Sirve para que la
// cotización pueda enumerar lo que de verdad se entrega —gasas, guantes,
// campo, manejo de RPBI— en vez de esconderlo en una línea de "logística".
//
// IMPORTANTE: aquí sólo viven CANTIDADES, no costos de compra. Cuánto le
// cuesta a Leucotec cada insumo es información interna y vive en su hoja;
// este bundle es público.
// ---------------------------------------------------------------------------

export interface InsumoAplicacion {
  nombre: string;
  /**
   * Sobre qué se cuenta: por cada dosis aplicada, o por turno de enfermería
   * (una enfermera durante una jornada).
   */
  base: 'dosis' | 'turno';
  /** Cuántas unidades se consumen por cada dosis o por cada turno. */
  cantidad: number;
  /** Unidad en singular, para redactar la línea. */
  unidad: string;
  /** Plural de la unidad. "par" no pluraliza con una "s" pegada. */
  unidadPlural: string;
}

/**
 * Consumibles de la aplicación.
 *
 * Parche, torunda y gel se gastan con cada dosis. Guantes, cubrebocas y campo
 * estéril son del personal: uno por enfermera por jornada (Leucotec, reunión
 * de sep 2026). Antes se contaban por dosis y la cotización exageraba: 200
 * dosis salían en 200 pares de guantes aunque las pusieran 2 enfermeras.
 */
export const INSUMOS_APLICACION: InsumoAplicacion[] = [
  { nombre: 'Parche post-punción', base: 'dosis', cantidad: 1, unidad: 'pieza', unidadPlural: 'piezas' },
  { nombre: 'Torunda de algodón', base: 'dosis', cantidad: 1, unidad: 'pieza', unidadPlural: 'piezas' },
  { nombre: 'Gel antibacterial', base: 'dosis', cantidad: 2, unidad: 'mL', unidadPlural: 'mL' },
  { nombre: 'Guantes de látex', base: 'turno', cantidad: 1, unidad: 'par', unidadPlural: 'pares' },
  { nombre: 'Cubrebocas del personal', base: 'turno', cantidad: 1, unidad: 'pieza', unidadPlural: 'piezas' },
  { nombre: 'Campo estéril', base: 'turno', cantidad: 1, unidad: 'pieza', unidadPlural: 'piezas' },
];

/**
 * Manejo de residuos peligrosos biológico-infecciosos.
 *
 * Va por evento, no por dosis: se instalan los contenedores y al cierre los
 * recoge una empresa certificada, que es lo que deja constancia del manejo
 * conforme a la NOM-087.
 */
export const MANEJO_RPBI = [
  { nombre: 'Contenedores rígidos RPBI (26 L y 53 L)', detalle: 'En sitio durante la jornada' },
  { nombre: 'Recolección y disposición certificada', detalle: 'Empresa autorizada, con manifiesto' },
];

/**
 * Cantidad de un insumo para la campaña, redondeada hacia arriba.
 * `turnos` = enfermeras por día x jornadas, sumando todas las sedes.
 */
export function cantidadInsumo(insumo: InsumoAplicacion, dosis: number, turnos: number): number {
  return Math.ceil(insumo.cantidad * (insumo.base === 'dosis' ? dosis : turnos));
}

/** Cómo se lee el rendimiento: "1 pieza por dosis", "1 par por enfermera por jornada". */
export function rendimientoDe(insumo: InsumoAplicacion): string {
  const u = unidadDe(insumo, insumo.cantidad);
  return insumo.base === 'dosis'
    ? `${insumo.cantidad} ${u} por dosis`
    : `${insumo.cantidad} ${u} por enfermera por jornada`;
}

/** La unidad como se debe leer para esa cantidad. */
export function unidadDe(insumo: InsumoAplicacion, cantidad: number): string {
  return cantidad === 1 ? insumo.unidad : insumo.unidadPlural;
}
