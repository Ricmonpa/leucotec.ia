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

import type { ParametrosEmpresa, ResultadoSimulacion } from './calculations';
import type { ParametrosEnfermedad } from './calculations';

/**
 * URL del Apps Script del cotizador. Es distinta a la del registro de leads:
 * ese script vive en el libro de prospectos, éste en el libro de costos.
 */
const COTIZADOR_URL: string =
  'https://script.google.com/macros/s/AKfycbzzc92nUTXnWFJeBLEv2l3knTHRStCxDP7v9JJ-kKAWRldMeErxd3cjPJRqGgSKhtY44Q/exec';

export type EstadoMargen = 'OK' | 'REVISAR' | 'SIN_CONEXION';

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
