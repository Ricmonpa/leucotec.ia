// ---------------------------------------------------------------------------
// Página de la cotización: /cotizacion?c=...
//
// Aquí llegan las dos puertas del vendedor. El botón del Sheet de Martin abre
// esta página con la cotización dentro del enlace; el dashboard hará lo
// mismo. El vendedor la revisa y la imprime o la guarda en PDF.
//
// No pasa por el registro de la entrada: es una herramienta interna y pedirle
// nombre y correo a un vendedor cada vez que cotiza sólo estorba.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { FileWarning, Printer } from 'lucide-react';
import { CotizacionDetallada } from './CotizacionDetallada';
import { leerCotizacionImprimible } from '../lib/cotizacionImprimible';

export function PaginaCotizacion() {
  const cotizacion = leerCotizacionImprimible();

  // El nombre del PDF sale del título de la página.
  useEffect(() => {
    if (!cotizacion) return;
    const cliente = cotizacion.cliente ? ` ${cotizacion.cliente}` : '';
    document.title = `Cotización${cliente} ${cotizacion.folio}`;
  }, [cotizacion]);

  if (!cotizacion || cotizacion.lineas.every((l) => l.dosis <= 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <FileWarning className="mx-auto h-10 w-10 text-brand-primary" />
          <h1 className="mt-4 text-lg font-bold text-brand-dark">No hay cotización que mostrar</h1>
          <p className="mt-2 text-sm text-slate-500">
            El enlace llegó sin datos o incompleto. Vuelve a la hoja, revisa que haya al menos una vacuna
            con dosis y dale otra vez a <strong>Imprimir cotización</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-cotizacion min-h-screen bg-slate-200 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-slate-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[8.5in] items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-dark">
              {cotizacion.cliente || 'Cotización'} · {cotizacion.folio}
            </p>
            <p className="text-xs text-slate-400">
              Revisa los datos. Para guardarla en PDF, elige “Guardar como PDF” al imprimir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex shrink-0 items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
          >
            <Printer className="h-4 w-4" />
            Imprimir cotización
          </button>
        </div>
      </div>

      <div className="px-3 py-6 print:p-0 sm:px-6">
        <CotizacionDetallada
          cotizacion={cotizacion}
          className="rounded-sm p-[0.6in] shadow-xl print:rounded-none print:p-0 print:shadow-none"
        />
      </div>
    </div>
  );
}
