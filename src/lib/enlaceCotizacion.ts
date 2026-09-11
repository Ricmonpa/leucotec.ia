// ---------------------------------------------------------------------------
// Puente cotizador → simulador.
//
// Leucotec cotiza primero (en su hoja) y de ahí salta al análisis de ROI. En
// vez de que el simulador LEA la hoja —que obligaría a resolver CORS y a
// exponer un endpoint de lectura—, la hoja arma un enlace con la cotización
// dentro. El vendedor le da clic y el simulador abre ya cargado.
//
// Nada sensible viaja aquí: sólo lo que el cliente ya tiene enfrente
// (empresa, personas y precio). Los costos de compra jamás salen de la hoja.
//
// Formato:
//   ?empresa=Grupo+Bimbo&emp=400&dia=1300
//   &v=Vaxigrip Tetra:400:440,Prevenar 20:400:1800
//   &log=0&dias=3&enf=2&via=0&sede=local&hrs=mas4
//   (log=1 sólo si se le cobra; hrs=1a4 baja la tarifa de enfermera)
// ---------------------------------------------------------------------------

import { PRODUCTOS_POR_ENFERMEDAD } from './catalogoProductos';
import type { ParametrosEmpresa, ParametrosEnfermedad } from './calculations';

/** Producto comercial → enfermedad a la que pertenece. */
const ENFERMEDAD_DE_PRODUCTO: Record<string, string> = (() => {
  const mapa: Record<string, string> = {};
  for (const [enfermedad, productos] of Object.entries(PRODUCTOS_POR_ENFERMEDAD)) {
    for (const p of productos) mapa[p.nombre.toLowerCase()] = enfermedad;
  }
  return mapa;
})();

export interface CotizacionRecibida {
  empresa: Partial<ParametrosEmpresa>;
  /** Una entrada por vacuna cotizada. */
  vacunas: { enfermedad: string; producto: string; personas: number; precio: number }[];
}

function num(v: string | null): number | undefined {
  if (v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Lee la cotización que venga en la URL. Devuelve null si no hay ninguna,
 * que es el caso normal cuando alguien entra directo al simulador.
 */
export function leerCotizacionDeUrl(
  busqueda: string = window.location.search,
): CotizacionRecibida | null {
  const p = new URLSearchParams(busqueda);
  if (!p.has('v') && !p.has('empresa')) return null;

  const empresa: Partial<ParametrosEmpresa> = {};
  const nombre = p.get('empresa');
  if (nombre) empresa.empresa = nombre;

  const empleados = num(p.get('emp'));
  if (empleados !== undefined && empleados > 0) empresa.numEmpleados = empleados;

  const costoDia = num(p.get('dia'));
  if (costoDia !== undefined) empresa.costoDiaEmpleado = costoDia;

  if (p.has('log')) empresa.cobrarLogistica = p.get('log') === '1';
  if (p.has('sede')) empresa.sedeForanea = p.get('sede') === 'foranea';
  if (p.has('hrs')) empresa.jornadaLarga = p.get('hrs') !== '1a4';

  const dias = num(p.get('dias'));
  if (dias !== undefined) empresa.diasVacunacion = dias;

  const enfermeras = num(p.get('enf'));
  if (enfermeras !== undefined) empresa.enfermerasPorDia = enfermeras;

  const viaticos = num(p.get('via'));
  if (viaticos !== undefined) empresa.viaticos = viaticos;

  const vacunas: CotizacionRecibida['vacunas'] = [];
  for (const parte of (p.get('v') ?? '').split(',')) {
    const [producto, personas, precio] = parte.split(':');
    if (!producto) continue;
    const enfermedad = ENFERMEDAD_DE_PRODUCTO[producto.trim().toLowerCase()];
    if (!enfermedad) continue; // producto que no está en el catálogo: se ignora
    vacunas.push({
      enfermedad,
      producto: producto.trim(),
      personas: Number(personas) || 0,
      precio: Number(precio) || 0,
    });
  }

  return { empresa, vacunas };
}

/**
 * Aplica la cotización sobre los valores de arranque.
 *
 * Las vacunas que vienen en el enlace quedan encendidas con su producto y
 * precio; las demás se apagan, porque la cotización manda.
 */
export function aplicarCotizacion(
  baseEmpresa: ParametrosEmpresa,
  baseEnfermedades: ParametrosEnfermedad[],
  cot: CotizacionRecibida,
): { empresa: ParametrosEmpresa; enfermedades: ParametrosEnfermedad[] } {
  const empresa = { ...baseEmpresa, ...cot.empresa };

  const enfermedades = baseEnfermedades.map((e) => {
    const linea = cot.vacunas.find((v) => v.enfermedad === e.nombre);
    if (!linea) return { ...e, activa: false };

    // El % de plantilla se deduce de a cuántas personas se les cotizó.
    const pct =
      empresa.numEmpleados > 0 && linea.personas > 0
        ? Math.min(1, linea.personas / empresa.numEmpleados)
        : e.pctPoblacionRiesgo;

    return {
      ...e,
      activa: true,
      producto: linea.producto,
      costoDosis: linea.precio > 0 ? linea.precio : e.costoDosis,
      pctPoblacionRiesgo: pct,
    };
  });

  return { empresa, enfermedades };
}
