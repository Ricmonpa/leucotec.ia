// ---------------------------------------------------------------------------
// Registro de acceso al simulador.
//
// No es un control de seguridad: es captura de prospecto. Quien entra deja
// nombre, correo y WhatsApp. Los datos se envían a:
//   1. Google Sheets vía Apps Script Web App (registro permanente)
//   2. ntfy.sh (notificación push en tiempo real)
//
// El registro se guarda en localStorage (no se vuelve a pedir en ese equipo),
// pero la notificación se manda una vez por sesión: así te enteras también
// cuando alguien regresa.
// ---------------------------------------------------------------------------

const CLAVE_LEAD = 'leucotec_lead';
const CLAVE_SESION = 'leucotec_sesion';
const NTFY_TOPIC = 'leucotec-roi-n3lab-demo';

// URL del Google Apps Script Web App.
// Reemplaza este valor con la URL que obtienes al publicar el script.
const GOOGLE_SHEET_URL =
  'https://script.google.com/a/macros/potenttial.com/s/AKfycbyKT5-nMu8QV5E6SyrGaCZq0cOl0TEye2YV4xN_0bU-LS-LG-VgrAVrzQn09Q3IPYA0/exec';

export interface Lead {
  nombre: string;
  correo: string;
  whatsapp: string;
}

/** Lee el registro guardado en este equipo, si existe. */
export function leerLead(): Lead | null {
  try {
    const crudo = localStorage.getItem(CLAVE_LEAD);
    if (!crudo) return null;
    const lead = JSON.parse(crudo) as Lead;
    return lead.nombre && lead.correo && lead.whatsapp ? lead : null;
  } catch {
    return null;
  }
}

/** Persiste el registro para no volver a pedirlo en este equipo. */
export function guardarLead(lead: Lead): void {
  try {
    localStorage.setItem(CLAVE_LEAD, JSON.stringify(lead));
  } catch {
    // Modo privado o storage bloqueado: se sigue sin persistir.
  }
}

/**
 * Marca la sesión como ya notificada.
 * Devuelve true la primera vez que se llama en cada sesión del navegador.
 */
export function esSesionNueva(): boolean {
  try {
    if (sessionStorage.getItem(CLAVE_SESION)) return false;
    sessionStorage.setItem(CLAVE_SESION, '1');
    return true;
  } catch {
    return false;
  }
}

const fechaMX = () =>
  new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

/** Envía el registro a Google Sheets. Silencioso si falla: nunca bloquea el acceso. */
export async function registrarEnSheets(
  lead: Lead,
  tipo: 'nuevo' | 'regreso',
): Promise<void> {
  if (GOOGLE_SHEET_URL === 'PEGA_AQUI_LA_URL_DEL_APPS_SCRIPT') return;

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      // Google Apps Script no acepta 'application/json' en modo no-cors,
      // por eso usamos text/plain y parseamos con JSON.parse en el script.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      mode: 'no-cors',
      body: JSON.stringify({
        fecha: fechaMX(),
        nombre: lead.nombre,
        correo: lead.correo,
        whatsapp: lead.whatsapp,
        tipo,
      }),
    });
  } catch {
    // Sin conexión o script caído: el usuario entra igual.
  }
}

/** Envía la notificación push. Silencioso si falla: nunca bloquea el acceso. */
export async function notificarAcceso(
  lead: Lead,
  tipo: 'nuevo' | 'regreso',
): Promise<void> {
  const titulo =
    tipo === 'nuevo' ? 'Nuevo registro — Simulador ROI' : 'Regresó al simulador';

  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: titulo,
        Priority: tipo === 'nuevo' ? 'high' : 'default',
        Tags: tipo === 'nuevo' ? 'tada' : 'eyes',
      },
      body: `${lead.nombre}\n${lead.correo}\nWA: ${lead.whatsapp}\n${fechaMX()}`,
    });
  } catch {
    // Sin conexión o ntfy caído: el usuario entra igual.
  }
}
