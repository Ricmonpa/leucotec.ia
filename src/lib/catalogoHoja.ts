// ---------------------------------------------------------------------------
// Catálogo de vacunas leído de la hoja de Martin.
//
// Martin mantiene las descripciones en su hoja (Costos, columnas A y B) y el
// cotizador en línea las toma de ahí: si cambia una descripción o agrega un
// producto, aparece aquí sin tocar código. Sólo viajan código y descripción;
// los costos nunca salen de la hoja.
//
// Se guarda una copia local para que el vendedor pueda cotizar aunque la hoja
// tarde en responder.
// ---------------------------------------------------------------------------

import { COTIZADOR_URL } from './cotizador';

export interface ProductoHoja {
  codigo: string;
  descripcion: string;
}

const CLAVE = 'leucotec.catalogo';

export function catalogoGuardado(): ProductoHoja[] {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE) || '[]') as ProductoHoja[];
    return Array.isArray(c) ? c : [];
  } catch {
    return [];
  }
}

/** Trae el catálogo vigente de la hoja. null si no se pudo. */
export async function cargarCatalogo(): Promise<ProductoHoja[] | null> {
  try {
    const r = await fetch(COTIZADOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ tipo: 'catalogo' }),
    });
    const d = (await r.json()) as { ok?: boolean; productos?: ProductoHoja[] };
    if (!d.ok || !Array.isArray(d.productos) || !d.productos.length) return null;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(d.productos));
    } catch {
      /* sin almacenamiento: sólo no se guarda la copia */
    }
    return d.productos;
  } catch {
    return null;
  }
}
