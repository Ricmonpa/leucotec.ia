// ---------------------------------------------------------------------------
// Catálogo comercial de Leucotec.
//
// El vendedor cotiza con nombre de marca ("Shingrix", "Prevenar 20"), no con
// la categoría clínica. Este catálogo permite elegir el producto exacto y que
// el precio se cargue solo, sin teclearlo de memoria.
//
// Los precios son de VENTA. Los costos de compra y los márgenes de Leucotec
// son información interna y no viven aquí: este bundle es público.
// Fuente: cotizador operativo de Leucotec, agosto 2026.
// ---------------------------------------------------------------------------

export interface Producto {
  /** Nombre comercial, tal como aparece en la cotización. */
  nombre: string;
  /** Precio de venta por esquema completo, por persona. */
  precio: number;
  /** Detalle opcional de presentación o esquema. */
  detalle?: string;
}

/**
 * Productos por enfermedad. La clave debe coincidir con el `nombre` de la
 * enfermedad en el catálogo del simulador.
 */
export const PRODUCTOS_POR_ENFERMEDAD: Record<string, Producto[]> = {
  Influenza: [
    { nombre: 'Vaxigrip Tetra', precio: 440, detalle: 'Jeringa 0.5 mL, 1 dosis' },
    { nombre: 'Fluzactal Tetra', precio: 330, detalle: 'Frasco 5 mL, 10 dosis' },
  ],
  Neumococo: [
    { nombre: 'Prevenar 20', precio: 1800, detalle: 'Conjugada, dosis única' },
    { nombre: 'Pulmovax', precio: 1400, detalle: 'PPSV23, polisacárido, 0.5 mL' },
  ],
  'Herpes Zóster': [
    { nombre: 'Shingrix', precio: 3500, detalle: 'Antígeno + adyuvante, 0.5 mL' },
  ],
  'COVID-19': [
    { nombre: 'Comirnaty XBB adulto', precio: 1060, detalle: '30 mcg, más de 12 años' },
    { nombre: 'Comirnaty XBB pediátrico', precio: 1060, detalle: '10 mcg, 5 a 11 años' },
  ],
  'Hepatitis A/B': [
    { nombre: 'Havrix + Engerix-B', precio: 1755, detalle: 'Esquema A+B, adulto' },
    { nombre: 'Havrix adulto (sólo A)', precio: 1140, detalle: '1440 U, 1 mL' },
    { nombre: 'Vaqta adulto (sólo A)', precio: 1165, detalle: '50 U, frasco 1 mL' },
    { nombre: 'Engerix-B adulto (sólo B)', precio: 615, detalle: 'Jeringa 1 mL' },
  ],
  'Fiebre Amarilla': [
    { nombre: 'Stamaril', precio: 3070, detalle: 'Cepa 17D, 1 dosis 0.5 mL' },
  ],
  VPH: [
    { nombre: 'Gardasil 9', precio: 3700, detalle: 'Jeringa 0.5 mL, 1 dosis' },
  ],
  'Td / DPT': [
    { nombre: 'Adacel Boost', precio: 650, detalle: 'Tdap, frasco 1 dosis' },
    { nombre: 'Boostrix', precio: 610, detalle: 'DPT acelular, jeringa 0.5 mL' },
  ],
  Meningococo: [
    { nombre: 'Menactra', precio: 3000, detalle: 'Conjugada, 1 dosis 0.5 mL' },
  ],
  'Triple Viral': [
    { nombre: 'MMR II', precio: 425, detalle: 'Sarampión, paperas, rubéola' },
    { nombre: 'Priorix', precio: 385, detalle: 'Jeringa 0.5 mL, 1 dosis' },
  ],
  Varicela: [
    { nombre: 'Varivax', precio: 1225, detalle: 'Frasco 1 dosis 0.5 mL' },
  ],
  Tifoidea: [
    { nombre: 'Typhim Vi', precio: 885, detalle: 'Jeringa 0.5 mL' },
  ],
  Antirrábica: [
    { nombre: 'Verorab', precio: 1120, detalle: 'Frasco 0.5 mL + jeringa' },
  ],
};

/** Productos disponibles para una enfermedad; vacío si no hay catálogo. */
export function productosDe(enfermedad: string): Producto[] {
  return PRODUCTOS_POR_ENFERMEDAD[enfermedad] ?? [];
}

/** Sin acentos ni mayúsculas: la hoja de Martin escribe "solo A", aquí "sólo A". */
const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Producto comercial → enfermedad a la que pertenece. */
const ENFERMEDAD_DE_PRODUCTO: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCTOS_POR_ENFERMEDAD).flatMap(([enfermedad, productos]) =>
    productos.map((p) => [normalizar(p.nombre), enfermedad]),
  ),
);

/** La enfermedad de un producto, o undefined si no está en el catálogo. */
export function enfermedadDeProducto(producto: string): string | undefined {
  return ENFERMEDAD_DE_PRODUCTO[normalizar(producto)];
}

/**
 * Lo que el sistema sabe de cada producto de la hoja de Martin, amarrado a su
 * CÓDIGO (columna A de Costos). La descripción NO vive aquí: la escribe Martin
 * en su hoja y el cotizador en línea la lee de ahí, así que puede cambiarla
 * cuando quiera sin romper nada.
 *
 * - precio: precio de venta de lista, para precargar el renglón. Es precio
 *   de VENTA; los costos nunca viven en este bundle público.
 * - enfermedad: para la propuesta de retorno (debe coincidir con el nombre
 *   de la enfermedad del simulador). Sin enfermedad, el producto cuenta como
 *   inversión sin ahorro.
 * - dosisPorCaja: si se puede cotizar en cajas (Martin, sep 2026: Comirnaty
 *   en cajas de 10).
 */
export interface DatosProducto {
  precio?: number;
  enfermedad?: string;
  dosisPorCaja?: number;
}

export const CATALOGO_POR_CODIGO: Record<string, DatosProducto> = {
  BIS120082: { precio: 440, enfermedad: 'Influenza' }, // Vaxigrip Tetra
  BIS120026: { precio: 330, enfermedad: 'Influenza' }, // Fluzactal Tetra
  BIS120089: { precio: 1800, enfermedad: 'Neumococo' }, // Prevenar 20
  BIS120028: { precio: 1400, enfermedad: 'Neumococo' }, // Pulmovax
  BIS120078: { precio: 3500, enfermedad: 'Herpes Zóster' }, // Shingrix
  BIS120083: { precio: 1060, enfermedad: 'COVID-19', dosisPorCaja: 10 }, // Comirnaty XBB adulto
  BIS120084: { precio: 1060, enfermedad: 'COVID-19', dosisPorCaja: 10 }, // Comirnaty XBB pediátrico
  'TMP-COMIRNATY-1': { enfermedad: 'COVID-19' },
  'TMP-COMIRNATY-2': { enfermedad: 'COVID-19' },
  'TMP-COMIRNATY-3': { enfermedad: 'COVID-19' },
  BIS120016: { precio: 1140, enfermedad: 'Hepatitis A/B' }, // Havrix adulto
  BIS120036: { precio: 1165, enfermedad: 'Hepatitis A/B' }, // Vaqta adulto
  BIS120009: { precio: 615, enfermedad: 'Hepatitis A/B' }, // Engerix-B adulto
  BIS120040: { enfermedad: 'Hepatitis A/B' }, // Twinrix
  BIS12011: { precio: 3070, enfermedad: 'Fiebre Amarilla' }, // Stamaril
  BIS120081: { precio: 3700, enfermedad: 'VPH' }, // Gardasil 9
  BIS120001: { precio: 650, enfermedad: 'Td / DPT' }, // Adacel Boost
  BIS120006: { precio: 610, enfermedad: 'Td / DPT' }, // Boostrix
  BIS120019: { precio: 3000, enfermedad: 'Meningococo' }, // Menactra
  BIS120020: { precio: 425, enfermedad: 'Triple Viral' }, // MMR II
  BIS120012: { precio: 385, enfermedad: 'Triple Viral' }, // Priorix
  BIS120041: { precio: 1225, enfermedad: 'Varicela' }, // Varivax
  BIS120039: { enfermedad: 'Varicela' }, // Varilrix
  BIS120044: { precio: 885, enfermedad: 'Tifoidea' }, // Typhim Vi
  BIS120042: { precio: 1120, enfermedad: 'Antirrábica' }, // Verorab
};

export const datosDe = (codigo?: string): DatosProducto =>
  (codigo && CATALOGO_POR_CODIGO[codigo]) || {};

/** Dosis por caja del producto; 1 si no se vende por caja. */
export function dosisPorCaja(codigo?: string): number {
  return datosDe(codigo).dosisPorCaja ?? 1;
}
