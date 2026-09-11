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
  /** Cuántas unidades se consumen por cada dosis aplicada. */
  porDosis: number;
  /** Unidad en singular, para redactar la línea. */
  unidad: string;
  /** Plural de la unidad. "par" no pluraliza con una "s" pegada. */
  unidadPlural: string;
}

/**
 * Consumibles por dosis. Las fracciones salen de su propio desglose: el
 * cubrebocas rinde 10 aplicaciones y el campo estéril 20.
 */
export const INSUMOS_APLICACION: InsumoAplicacion[] = [
  { nombre: 'Parche post-punción', porDosis: 1, unidad: 'pieza', unidadPlural: 'piezas' },
  { nombre: 'Torunda de algodón', porDosis: 1, unidad: 'pieza', unidadPlural: 'piezas' },
  { nombre: 'Gel antibacterial', porDosis: 2, unidad: 'mL', unidadPlural: 'mL' },
  { nombre: 'Guantes de látex', porDosis: 1, unidad: 'par', unidadPlural: 'pares' },
  { nombre: 'Cubrebocas del personal', porDosis: 0.1, unidad: 'pieza', unidadPlural: 'piezas' },
  { nombre: 'Campo estéril', porDosis: 0.05, unidad: 'pieza', unidadPlural: 'piezas' },
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

/** Cantidad de un insumo para un número de dosis, ya redondeada hacia arriba. */
export function cantidadInsumo(insumo: InsumoAplicacion, dosis: number): number {
  return Math.ceil(insumo.porDosis * dosis);
}

/** La unidad como se debe leer para esa cantidad. */
export function unidadDe(insumo: InsumoAplicacion, cantidad: number): string {
  return cantidad === 1 ? insumo.unidad : insumo.unidadPlural;
}
