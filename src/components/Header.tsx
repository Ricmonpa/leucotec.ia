import { ClipboardCheck, FileDown, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import type { EstadoMargen } from '../lib/cotizador';

interface HeaderProps {
  empresa: string;
  onExport: () => void;
  onReset: () => void;
  onReanalizar: () => void;
  /** Ausente si Leucotec aún no conecta su cotizador interno. */
  onEnviarCotizador?: () => void;
  enviandoCotizacion?: boolean;
  /** Semáforo de margen. Es un punto de color: no dice cifras al cliente. */
  estadoMargen?: EstadoMargen | null;
}

export function Header({
  empresa,
  onExport,
  onReset,
  onReanalizar,
  onEnviarCotizador,
  enviandoCotizacion,
  estadoMargen,
}: HeaderProps) {
  const colorSemaforo =
    estadoMargen === 'OK'
      ? 'bg-emerald-500'
      : estadoMargen === 'REVISAR'
        ? 'bg-brand-primary'
        : 'bg-slate-300';
  return (
    <header className="mb-6 flex flex-col gap-4 border-b-2 border-slate-200 pb-4 md:mb-8 md:flex-row md:items-center md:justify-between md:pb-5">
      <div className="flex items-center gap-3">
        <img
          src="/logo-leucotec.png"
          alt="Grupo Leucotec"
          className="h-7 w-auto sm:h-9 md:h-11"
        />
        <div className="hidden border-l border-slate-200 pl-3 sm:block">
          <h1 className="text-sm font-bold uppercase tracking-wider text-brand-dark md:text-base">
            Analítica Corporativa
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 md:text-xs">
            Simulador de Riesgo Financiero
          </p>
        </div>
        <div className="hidden items-center gap-1.5 border-l border-slate-200 pl-3 sm:flex">
          <span className="text-[10px] text-slate-400">by</span>
          <span
            className="inline-flex items-center rounded-md p-0.5"
            style={{ background: 'linear-gradient(135deg, #1F2A44 0%, #D6443B 100%)' }}
          >
            <img src="/n3-logo.png" alt="N3 Thinktech IA Laboratory" className="h-5 w-auto" />
          </span>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 md:w-auto md:gap-3">
        <div className="flex min-w-0 flex-1 items-baseline rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm md:flex-none">
          <span className="mr-2 shrink-0 text-sm text-slate-500">Prospecto:</span>
          <span className="truncate font-bold text-brand-dark">{empresa}</span>
        </div>
        {onEnviarCotizador && (
          <button
            onClick={onEnviarCotizador}
            disabled={enviandoCotizacion}
            title="Enviar a mi cotizador"
            className="no-print relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-primary disabled:opacity-60"
          >
            {enviandoCotizacion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardCheck className="h-4 w-4" />
            )}
            {estadoMargen && !enviandoCotizacion && (
              <span
                aria-hidden="true"
                className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${colorSemaforo}`}
              />
            )}
          </button>
        )}
        <button
          onClick={onReanalizar}
          title="Ejecutar el análisis de nuevo"
          className="no-print flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-primary"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <button
          onClick={onReset}
          title="Restablecer valores"
          className="no-print flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-primary"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={onExport}
          className="no-print flex shrink-0 items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>
    </header>
  );
}
