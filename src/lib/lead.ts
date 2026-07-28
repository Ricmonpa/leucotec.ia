// ---------------------------------------------------------------------------
// Registro de acceso al simulador.
//
// No es un control de seguridad: es captura de prospecto. Quien entra deja
// nombre y correo, y eso dispara una notificación push vía ntfy.sh para saber
// quién está usando la herramienta y cuándo.
//
// El registro se guarda en localStorage (no se vuelve a pedir en ese equipo),
// pero la notificación se manda una vez por sesión: así te enteras también
// cuando alguien regresa.
// ---------------------------------------------------------------------------

const CLAVE_LEAD = 'leucotec_lead';
const CLAVE_SESION = 'leucotec_sesion';
const NTFY_TOPIC = 'leucotec-roi-n3lab-demo';

export interface Lead {
  nombre: string;
  correo: string;
}

/** Lee el registro guardado en este equipo, si existe. */
export function leerLead(): Lead | null {
  try {
    const crudo = localStorage.getItem(CLAVE_LEAD);
    if (!crudo) return null;
    const lead = JSON.parse(crudo) as Lead;
    return lead.nombre && lead.correo ? lead : null;
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
      body: `${lead.nombre}\n${lead.correo}\n${fechaMX()}`,
    });
  } catch {
    // Sin conexión o ntfy caído: el usuario entra igual.
  }
}
