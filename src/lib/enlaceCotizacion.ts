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
//   &log=0
//   &sedes=CDMX:400:local:mas4:2:3:1500:0|Toluca:120:foranea:mas4:1:2:3000:450
//
// Cada sede va como destino:dosis:local|foranea:1a4|mas4:enfermeras:dias:
// transporte:comidas. Su cotizador admite hasta cuatro y pueden operar al
// mismo tiempo, así que los días NO se suman entre sedes.
//
// (log=1 sólo si la logística se le cobra al cliente; hrs=1a4 baja la tarifa
// de enfermera. Los enlaces con el formato viejo de una sola sede
// —dias, enf, via, sede, hrs— se siguen leyendo.)
// ---------------------------------------------------------------------------

import { enfermedadDeProducto } from './catalogoProductos';
import type { ParametrosEmpresa, ParametrosEnfermedad, Sede } from './calculations';

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
 * Lee las sedes de la campaña.
 *
 * Formato nuevo, una sede por bloque separado con "|":
 *   sedes=destino:dosis:local|foranea:1a4|mas4:enfermeras:dias:transporte:comidas
 *
 * Si el enlace viene del formato anterior —una sola sede— se arma con eso,
 * para que los enlaces que ya se mandaron a algún cliente sigan abriendo.
 */
function leerSedes(p: URLSearchParams): Sede[] {
  const crudo = p.get('sedes');
  if (crudo) {
    const sedes = crudo
      .split('|')
      .map((bloque) => {
        const c = bloque.split(':');
        if (c.length < 8) return null;
        return {
          // URLSearchParams ya decodificó el parámetro completo: volver a
          // decodificar aquí truena con cualquier destino que traiga un "%".
          destino: (c[0] ?? '').trim(),
          dosis: Number(c[1]) || 0,
          foranea: c[2] === 'foranea',
          jornadaLarga: c[3] !== '1a4',
          enfermerasPorDia: Number(c[4]) || 0,
          diasVacunacion: Number(c[5]) || 0,
          transporte: Number(c[6]) || 0,
          comidas: Number(c[7]) || 0,
        };
      })
      .filter((s): s is Sede => s !== null);
    if (sedes.length) return sedes;
  }

  // Formato anterior: una sola sede repartida en parámetros sueltos.
  const viejos = ['sede', 'hrs', 'dias', 'enf', 'via'];
  if (!viejos.some((k) => p.has(k))) return [];

  return [
    {
      destino: '',
      dosis: 0,
      foranea: p.get('sede') === 'foranea',
      jornadaLarga: p.get('hrs') !== '1a4',
      enfermerasPorDia: num(p.get('enf')) ?? 1,
      diasVacunacion: num(p.get('dias')) ?? 1,
      // El formato viejo mandaba transporte y comidas ya sumados.
      transporte: num(p.get('via')) ?? 0,
      comidas: 0,
    },
  ];
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

  const sedes = leerSedes(p);
  if (sedes.length) empresa.sedes = sedes;

  const vacunas: CotizacionRecibida['vacunas'] = [];
  for (const parte of (p.get('v') ?? '').split(',')) {
    const [producto, personas, precio] = parte.split(':');
    if (!producto) continue;
    const enfermedad = enfermedadDeProducto(producto);
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
