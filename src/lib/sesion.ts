// ---------------------------------------------------------------------------
// Sesión del cotizador en línea.
//
// El vendedor entra con su correo de Leucotec y un código que le llega por
// correo. El Sheet valida el código y regresa una sesión firmada; aquí sólo se
// guarda y se reenvía. La protección real está en el Sheet: sin una sesión
// que él mismo firmó, no entrega el % de margen. Esta pantalla de entrada
// sólo ordena la experiencia.
// ---------------------------------------------------------------------------

import { COTIZADOR_URL } from './cotizador';

const CLAVE = 'leucotec.cotizador.sesion';

export interface Sesion {
  correo: string;
  token: string;
  /** Vencimiento en milisegundos. */
  vence: number;
}

export function leerSesion(): Sesion | null {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE) || 'null') as Sesion | null;
    return s && s.token && s.vence > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function guardarSesion(s: Sesion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(s));
  } catch {
    /* sin almacenamiento: la sesión dura lo que dure la pestaña */
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}

async function llamar(cuerpo: object): Promise<{ ok?: boolean; error?: string } & Record<string, unknown>> {
  try {
    const r = await fetch(COTIZADOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(cuerpo),
    });
    return await r.json();
  } catch {
    return { ok: false, error: 'sin-conexion' };
  }
}

const MENSAJES: Record<string, string> = {
  'correo-no-autorizado': 'Ese correo no tiene acceso. Usa tu correo @leucotec.mx.',
  espera: 'Ya te enviamos un código. Espera un minuto antes de pedir otro.',
  'codigo-vencido': 'El código venció o se usó demasiadas veces. Pide uno nuevo.',
  'codigo-incorrecto': 'El código no coincide. Revisa el correo e inténtalo de nuevo.',
  'sin-conexion': 'No hay conexión con el cotizador. Revisa tu internet.',
};

const mensaje = (error?: string) => MENSAJES[error ?? ''] ?? 'Algo falló. Intenta de nuevo.';

/** Pide el código. Devuelve null si salió bien, o el mensaje de error. */
export async function pedirCodigo(correo: string): Promise<string | null> {
  const r = await llamar({ tipo: 'pedirCodigo', correo: correo.trim().toLowerCase() });
  return r.ok ? null : mensaje(r.error);
}

/** Valida el código. Devuelve la sesión o el mensaje de error. */
export async function verificarCodigo(correo: string, codigo: string): Promise<Sesion | string> {
  const r = await llamar({
    tipo: 'verificarCodigo',
    correo: correo.trim().toLowerCase(),
    codigo: codigo.trim(),
  });
  if (!r.ok || typeof r.sesion !== 'string') return mensaje(r.error);
  const s: Sesion = {
    correo: String(r.correo),
    token: r.sesion,
    vence: Date.now() + Number(r.dias || 30) * 86400000,
  };
  guardarSesion(s);
  return s;
}
