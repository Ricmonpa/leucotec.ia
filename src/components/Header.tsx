import { FileDown, RotateCcw } from 'lucide-react';

interface HeaderProps {
  empresa: string;
  onExport: () => void;
  onReset: () => void;
}

export function Header({ empresa, onExport, onReset }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col items-start gap-4 border-b-2 border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <img
          src="/logo-leucotec.png"
          alt="Grupo Leucotec"
          className="h-9 w-auto md:h-11"
        />
        <div className="border-l border-slate-200 pl-4">
          <h1 className="text-sm font-bold uppercase tracking-wider text-brand-dark md:text-base">
            Analítica Corporativa
          </h1>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Simulador de Riesgo Financiero Biológico
          </p>
        </div>
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-2 shadow-sm md:flex-none">
          <span className="mr-2 text-sm text-slate-500">Prospecto:</span>
          <span className="font-bold text-brand-dark">{empresa}</span>
        </div>
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
