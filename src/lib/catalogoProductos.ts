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
