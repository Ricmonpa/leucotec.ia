// ---------------------------------------------------------------------------
// Envío de la cotización al cotizador interno de Leucotec (Google Sheets).
//
// Sale de aquí SÓLO lo que el cliente ya tiene enfrente: empresa, personas,
// producto y precio. Los costos de compra y el margen viven en el Sheet, que
// está detrás del login de Google. Este bundle es público: nada sensible
// puede vivir en él.
//
// El Sheet responde con un semáforo ("OK" / "REVISAR") —una palabra, sin
// cifras— para que el vendedor sepa si el precio aguanta sin sacar el celular.
// ---------------------------------------------------------------------------

import { descuadreDosis, type ParametrosEmpresa, type ResultadoSimulacion } from './calculations';
import type { ParametrosEnfermedad } from './calculations';
import { resumirCotizacion, type CotizacionImprimible } from './cotizacionImprimible';

/**
 * URL del Apps Script del cotizador. Es distinta a la del registro de leads:
 * ese script vive en el libro de prospectos, éste en el libro de costos.
 */
const COTIZADOR_URL: string =
  'https://script.google.com/macros/s/AKfycbzzc92nUTXnWFJeBLEv2l3knTHRStCxDP7v9JJ-kKAWRldMeErxd3cjPJRqGgSKhtY44Q/exec';

/**
 * REVISAR_DOSIS no viene del Sheet: se decide aquí, antes de enviar. Si las
 * dosis por sede no cuadran, la logística está mal y el margen no significa
 * nada, así que ni se consulta ni se guarda en el historial.
 */
export type EstadoMargen = 'OK' | 'REVISAR' | 'REVISAR_DOSIS' | 'SIN_CONEXION';

export interface EnvioCotizacion {
  folio: string;
  estado: EstadoMargen;
}

/** True si Leucotec ya conectó su cotizador. */
export function cotizadorConfigurado(): boolean {
  return COTIZADOR_URL !== 'PEGA_AQUI_LA_URL_DEL_COTIZADOR';
}

const fechaMX = () =>
  new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

function nuevoFolio(): string {
  const d = new Date();
  const sello = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join('');
  return `COT-${sello}`;
}

/**
 * Manda la cotización al Sheet y devuelve el semáforo.
 *
 * Nunca lanza: si falla la red o el script, el vendedor sigue trabajando y
 * sólo pierde el indicador.
 */
export async function enviarCotizacion(
  empresa: ParametrosEmpresa,
  enfermedades: ParametrosEnfermedad[],
  resultado: ResultadoSimulacion,
  vendedor: string,
): Promise<EnvioCotizacion> {
  const folio = nuevoFolio();

  if (!cotizadorConfigurado()) {
    return { folio, estado: 'SIN_CONEXION' };
  }
  if (descuadreDosis(resultado.logistica)) {
    return { folio, estado: 'REVISAR_DOSIS' };
  }

  const activas = enfermedades.filter((e) => e.activa);
  const lineas = activas.map((e) => {
    const det = resultado.detalle.find((d) => d.nombre === e.nombre);
    return {
      producto: e.producto,
      personas: det?.poblacionRiesgo ?? 0,
      precioUnitario: e.costoDosis,
    };
  });

  try {
    const r = await fetch(COTIZADOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        tipo: 'cotizacion',
        folio,
        fecha: fechaMX(),
        vendedor,
        empresa: empresa.empresa,
        empleados: empresa.numEmpleados,
        lineas,
        logistica: {
          dosis: resultado.logistica.dosisTotales,
          total: Math.round(resultado.logistica.total),
          cobradaAlCliente: empresa.cobrarLogistica,
          // Una línea por sede: la campaña puede correr en varias plantas a
          // la vez y el margen se revisa sede por sede.
          sedes: resultado.logistica.sedes.map((s) => ({
            destino: s.destino,
            dosis: s.dosis,
            foranea: s.foranea,
            turnos: s.turnos,
            enfermeras: Math.round(s.enfermeras),
            viaticos: Math.round(s.viaticos),
            insumos: Math.round(s.insumos),
            total: Math.round(s.total),
          })),
        },
      }),
    });

    const datos = (await r.json()) as { estado?: string };
    const estado = datos.estado === 'OK' || datos.estado === 'REVISAR'
      ? datos.estado
      : 'SIN_CONEXION';

    return { folio, estado };
  } catch {
    // Apps Script sin CORS abierto, sin señal, o script caído.
    return { folio, estado: 'SIN_CONEXION' };
  }
}

/**
 * Manda al Sheet una cotización del cotizador en línea y devuelve el semáforo.
 *
 * Es el mismo receptor que usa el simulador: cruza cada producto contra los
 * costos de compra, suma la logística como costo y compara el margen contra
 * el mínimo de Martin. Al navegador sólo regresa una palabra —OK o REVISAR—,
 * nunca el costo ni el margen: con el margen y el precio a la vista, un
 * vendedor podría despejar el costo de compra con una resta.
 *
 * De paso deja la cotización en el historial del Sheet, con su folio.
 */
export async function revisarMargenCotizacion(
  cotizacion: CotizacionImprimible,
  vendedor: string,
): Promise<EnvioCotizacion> {
  const { folio } = cotizacion;
  if (!cotizadorConfigurado()) return { folio, estado: 'SIN_CONEXION' };

  const r = resumirCotizacion(cotizacion);
  if (descuadreDosis(r.logistica)) return { folio, estado: 'REVISAR_DOSIS' };

  try {
    const respuesta = await fetch(COTIZADOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        tipo: 'cotizacion',
        folio,
        fecha: fechaMX(),
        vendedor,
        empresa: cotizacion.cliente,
        empleados: cotizacion.empleados,
        lineas: r.lineas.map((l) => ({
          producto: l.producto,
          personas: l.dosis,
          precioUnitario: l.precio,
        })),
        logistica: {
          dosis: r.dosisTotales,
          total: Math.round(r.logistica.total),
          cobradaAlCliente: cotizacion.cobrarLogistica,
        },
      }),
    });

    const datos = (await respuesta.json()) as { estado?: string };
    const estado =
      datos.estado === 'OK' || datos.estado === 'REVISAR' ? datos.estado : 'SIN_CONEXION';
    return { folio, estado };
  } catch {
    return { folio, estado: 'SIN_CONEXION' };
  }
}
