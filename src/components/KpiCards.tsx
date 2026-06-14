import { TrendingDown, Wallet, TrendingUp } from 'lucide-react';
import { formatCurrency, type ResultadoSimulacion } from '../lib/calculations';

interface KpiCardsProps {
  resultado: ResultadoSimulacion;
}

export function KpiCards({ resultado }: KpiCardsProps) {
  const roi = resultado.roiGlobal.toFixed(1);
  const roiPositivo = resultado.roiGlobal >= 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Pérdida proyectada */}
      <div className="flex flex-col justify-between rounded-2xl border-l-4 border-brand-danger bg-white p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-brand-danger" />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pérdida Proyectada
            </p>
          </div>
          <p className="mb-2 text-xs text-slate-400">Por ausentismo no mitigado</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">
          {formatCurrency(resultado.costoAusentismoTotal)}
        </p>
      </div>

      {/* Inversión */}
      <div className="flex flex-col justify-between rounded-2xl border-l-4 border-brand-secondary bg-white p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand-secondary" />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Inversión Leucotec
            </p>
          </div>
          <p className="mb-2 text-xs text-slate-400">Campaña integral de vacunación</p>
        </div>
        <p className="text-3xl font-bold text-brand-secondary">
          {formatCurrency(resultado.inversionTotal)}
        </p>
      </div>

      {/* Ahorro neto — el gancho */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-6 text-white shadow-xl transition-transform duration-300 hover:scale-[1.03]">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
            Ahorro Operativo Neto
          </p>
          <p className="mb-2 text-xs text-blue-200">Impacto directo a utilidades</p>
        </div>
        <p className="text-4xl font-black drop-shadow-md">
          {formatCurrency(resultado.ahorroNetoTotal)}
        </p>
        <div
          className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-inner ${
            roiPositivo ? 'bg-brand-accent' : 'bg-brand-danger'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          ROI {roi}%
        </div>
      </div>
    </div>
  );
}
