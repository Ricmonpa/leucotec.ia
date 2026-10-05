// ---------------------------------------------------------------------------
// La cotización que se imprime.
//
// Es el producto final de todo el proceso: lo que el vendedor le entrega al
// cliente. Tiene dos puertas de entrada —el Sheet de Martin y el dashboard— y
// un solo documento. Si cada puerta armara su propia cotización, en un mes
// dejarían de coincidir.
//
// Por eso la cotización tiene su propio modelo y no reutiliza el del ROI: el
// ROI agrupa por enfermedad y descarta los productos que no conoce, y en una
// cotización un renglón perdido es un total que no cuadra con la hoja. Aquí
// cada renglón viaja tal cual lo capturó el vendedor.
//
// Sólo viajan PRECIOS DE VENTA. Los costos de compra nunca salen de la hoja.
// ---------------------------------------------------------------------------

import {
  calcularLogistica,
  type CostoLogistica,
  type ParametrosEmpresa,
  type ParametrosEnfermedad,
  type ResultadoSimulacion,
  type Sede,
} from './calculations';

/** Un renglón de biológico, tal cual lo capturó el vendedor. */
export interface LineaCotizacion {
  /** Descripción tal como la escribe Martin en su hoja. Es lo que ve el cliente. */
  producto: string;
  /**
   * Código del producto en la hoja de Martin (columna A de Costos). Es la
   * llave: la descripción puede cambiar, el código no.
   */
  codigo?: string;
  dosis: number;
  /** Precio de venta por dosis. */
  precio: number;
  /**
   * Personas a vacunar en este renglón. Cuando el producto lleva esquema de
   * varias dosis (VPH, Herpes Zóster), dosis = personas x dosisPorPersona.
   * La cotización lo imprime para que quede claro cómo se cotizó, y el
   * retorno de la inversión cuenta personas, no dosis.
   */
  personas?: number;
  /** Dosis por persona del esquema cotizado. 1 = sólo la dosis inicial. */
  dosisPorPersona?: number;
  /** Rango de edad del esquema, cuando el producto depende de la edad. */
  rango?: string;
}

/** Condición de pago de la venta (Martin, oct 2026: la tarjeta va aparte). */
export type CondicionPago = 'Contado' | 'Crédito';

export interface CotizacionImprimible {
  folio: string;
  cliente: string;
  /** Plantilla del cliente. 0 si no se capturó. */
  empleados: number;
  lineas: LineaCotizacion[];
  sedes: Sede[];
  /**
   * Si la operación se cobra como cargo aparte. Normalmente no: va dentro
   * del precio por dosis y la cotización enumera todo como "Incluido".
   */
  cobrarLogistica: boolean;
  /** Contado o crédito. Sale impreso en las condiciones de la cotización. */
  pago?: CondicionPago;
  /**
   * Lo que le cuesta a la empresa un día sin un empleado. No sale en la
   * cotización: lo usa la propuesta de retorno. 0 si no se capturó.
   */
  costoDia?: number;
}

/**
 * Folio con fecha, hora y dos dígitos: COT-20261005-1430-01.
 *
 * Los dos dígitos existen porque dos vendedores pueden generar una cotización
 * en el mismo minuto. `usados` son los folios que ya se ocuparon en esta
 * puerta; se busca el primer sufijo libre.
 *
 * El folio se asigna UNA vez y no se vuelve a calcular: si cambiara al editar
 * dosis o precios, la cotización impresa dejaría de coincidir con la que quedó
 * en el historial.
 */
export function nuevoFolio(fecha: Date = new Date(), usados: string[] = []): string {
  const d = (n: number) => String(n).padStart(2, '0');
  const base =
    `COT-${fecha.getFullYear()}${d(fecha.getMonth() + 1)}${d(fecha.getDate())}` +
    `-${d(fecha.getHours())}${d(fecha.getMinutes())}`;
  for (let n = 1; n < 100; n++) {
    const folio = `${base}-${d(n)}`;
    if (!usados.includes(folio)) return folio;
  }
  // 99 cotizaciones en el mismo minuto no pasa; si pasara, los segundos rompen el empate.
  return `${base}-${d(fecha.getSeconds())}`;
}

export interface ResumenCotizacion {
  lineas: (LineaCotizacion & { importe: number })[];
  dosisTotales: number;
  subtotalBiologicos: number;
  logistica: CostoLogistica;
  /** Jornadas en sitio, sumando todas las sedes. */
  jornadas: number;
  /** Turnos de enfermería: enfermeras por día x jornadas, en todas las sedes. */
  turnos: number;
  /** Lo que paga el cliente. */
  total: number;
}

/**
 * Hace las cuentas de la cotización.
 *
 * La logística sale del mismo motor que el simulador, que ya cuadra al
 * centavo con el Excel de Martin. Se calcula siempre, se cobre o no.
 */
export function resumirCotizacion(c: CotizacionImprimible): ResumenCotizacion {
  const lineas = c.lineas
    .filter((l) => l.producto && l.dosis > 0)
    .map((l) => ({ ...l, importe: l.dosis * l.precio }));

  const dosisTotales = lineas.reduce((s, l) => s + l.dosis, 0);
  const subtotalBiologicos = lineas.reduce((s, l) => s + l.importe, 0);

  const logistica = calcularLogistica(
    { sedes: c.sedes } as ParametrosEmpresa,
    dosisTotales,
  );

  const jornadas = logistica.sedes.reduce((s, x) => s + x.diasVacunacion, 0);
  const turnos = logistica.sedes.reduce((s, x) => s + x.turnos, 0);
  const total = subtotalBiologicos + (c.cobrarLogistica ? logistica.total : 0);

  return { lineas, dosisTotales, subtotalBiologicos, logistica, jornadas, turnos, total };
}

// ---------------------------------------------------------------------------
// El enlace.
//
// La cotización viaja en la URL como JSON en base64. Se descartó el formato de
// separadores del enlace al ROI porque las descripciones del catálogo de
// Martin traen comas, dos puntos y acentos ("FLUZACTAL TETRA, SUS,10 DS"): con
// separadores, un renglón se parte en pedazos. El JSON aguanta cualquier
// texto. Las llaves son cortas porque el enlace se arma dentro de una celda.
// ---------------------------------------------------------------------------

interface CargaUtil {
  f?: string; // folio
  c?: string; // cliente
  e?: number; // empleados
  // producto, dosis, precio, código, personas, dosis por persona, rango
  l?: [string, number, number, string?, number?, number?, string?][];
  // destino, dosis, foránea (1/0), jornada larga (1/0), enfermeras/día,
  // jornadas, transporte, comidas
  s?: [string, number, number, number, number, number, number, number][];
  cl?: number; // cobrar logística (1/0)
  pg?: string; // condición de pago: "Contado" o "Crédito"
  d?: number; // costo por día de ausencia de un empleado
}

function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(cadena: string): string {
  const normal = cadena.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = normal + '='.repeat((4 - (normal.length % 4)) % 4);
  const binario = atob(relleno);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Arma el parámetro `c` del enlace. */
export function codificarCotizacion(c: CotizacionImprimible): string {
  const carga: CargaUtil = {
    f: c.folio,
    c: c.cliente,
    e: c.empleados,
    l: c.lineas.map((l) =>
      // El renglón crece sólo cuando hace falta: el enlace se arma dentro de
      // una celda de Sheets y no conviene inflarlo.
      (l.dosisPorPersona ?? 1) > 1
        ? [l.producto, l.dosis, l.precio, l.codigo ?? '', l.personas ?? 0, l.dosisPorPersona ?? 1, l.rango ?? '']
        : l.codigo
          ? [l.producto, l.dosis, l.precio, l.codigo]
          : [l.producto, l.dosis, l.precio],
    ),
    s: c.sedes.map((s) => [
      s.destino,
      s.dosis,
      s.foranea ? 1 : 0,
      s.jornadaLarga ? 1 : 0,
      s.enfermerasPorDia,
      s.diasVacunacion,
      s.transporte,
      s.comidas,
    ]),
    cl: c.cobrarLogistica ? 1 : 0,
    ...(c.pago ? { pg: c.pago } : {}),
    d: c.costoDia || 0,
  };
  return aBase64Url(JSON.stringify(carga));
}

/**
 * Lee la cotización del enlace. Devuelve null si no hay o si viene dañada:
 * es preferible no mostrar nada que mostrar una cotización con números
 * equivocados.
 */
export function leerCotizacionImprimible(
  busqueda: string = window.location.search,
): CotizacionImprimible | null {
  const crudo = new URLSearchParams(busqueda).get('c');
  if (!crudo) return null;

  let carga: CargaUtil;
  try {
    carga = JSON.parse(deBase64Url(crudo)) as CargaUtil;
  } catch {
    return null;
  }
  if (!Array.isArray(carga.l)) return null;

  return {
    folio: String(carga.f || nuevoFolio()),
    cliente: String(carga.c || ''),
    empleados: num(carga.e),
    lineas: carga.l.map(([producto, dosis, precio, codigo, personas, porPersona, rango]) => ({
      producto: String(producto || '').trim(),
      dosis: num(dosis),
      precio: num(precio),
      ...(codigo ? { codigo: String(codigo) } : {}),
      ...(num(personas) > 0 ? { personas: num(personas) } : {}),
      ...(num(porPersona) > 1 ? { dosisPorPersona: num(porPersona) } : {}),
      ...(rango ? { rango: String(rango) } : {}),
    })),
    sedes: (carga.s ?? []).map(([destino, dosis, foranea, larga, enf, dias, transporte, comidas]) => ({
      destino: String(destino || '').trim(),
      dosis: num(dosis),
      foranea: foranea === 1,
      jornadaLarga: larga === 1,
      enfermerasPorDia: num(enf),
      diasVacunacion: num(dias),
      transporte: num(transporte),
      comidas: num(comidas),
    })),
    cobrarLogistica: carga.cl === 1,
    ...(carga.pg === 'Contado' || carga.pg === 'Crédito' ? { pago: carga.pg } : {}),
    costoDia: num(carga.d),
  };
}

/** La cotización que sale del simulador, con el mismo formato que la del Sheet. */
export function cotizacionDesdeSimulador(
  empresa: ParametrosEmpresa,
  enfermedades: ParametrosEnfermedad[],
  resultado: ResultadoSimulacion,
): CotizacionImprimible {
  return {
    folio: nuevoFolio(),
    cliente: empresa.empresa,
    empleados: empresa.numEmpleados,
    lineas: enfermedades
      .filter((e) => e.activa)
      .map((e) => ({
        producto: e.producto,
        dosis: resultado.detalle.find((d) => d.nombre === e.nombre)?.poblacionRiesgo ?? 0,
        precio: e.costoDosis,
      })),
    sedes: empresa.sedes,
    cobrarLogistica: empresa.cobrarLogistica,
    costoDia: empresa.costoDiaEmpleado,
  };
}
