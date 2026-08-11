import { TrendingDown, Wallet, TrendingUp, Landmark } from 'lucide-react';
import { formatCurrency, type ResultadoSimulacion } from '../lib/calculations';
import { useCountUp } from '../hooks/useCountUp';

interface KpiCardsProps {
  resultado: ResultadoSimulacion;
}

export function KpiCards({ resultado }: KpiCardsProps) {
  // Los números corren hasta su valor final: el cálculo ya está hecho, sólo
  // se revela con movimiento para que se lea como un motor trabajando.
  const perdida = useCountUp(resultado.costoTotalExpuesto);
  const ausentismo = useCountUp(resultado.costoAusentismoTotal);
  const medico = useCountUp(resultado.costoMedicoTotal);
  const inversion = useCountUp(resultado.inversionTotal);
  const fiscal = useCountUp(resultado.ahorroFiscal);
  const neta = useCountUp(resultado.inversionNeta);
  const ahorro = useCountUp(resultado.ahorroNetoTotal);
  const roiAnimado = useCountUp(resultado.roiGlobal);

  const roi = roiAnimado.toFixed(1);
  const roiPositivo = resultado.roiGlobal >= 0;
  const conFiscal = resultado.ahorroFiscal > 0;

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
          <p className="mb-2 text-xs text-slate-400">Ausentismo + atención médica</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-800">
            {formatCurrency(perdida)}
          </p>
          <p className="mt-2 text-[11px] leading-snug text-slate-400">
            {formatCurrency(ausentismo)} en días perdidos ·{' '}
            {formatCurrency(medico)} en atención
          </p>
        </div>
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

        {conFiscal ? (
          <div>
            <p className="text-2xl font-bold text-slate-400 line-through decoration-1">
              {formatCurrency(inversion)}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Landmark className="h-3.5 w-3.5" />
              Recupera {formatCurrency(fiscal)} de ISR
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
              Costo real
            </p>
            <p className="text-3xl font-bold text-brand-secondary">
              {formatCurrency(neta)}
            </p>
          </div>
        ) : (
          <p className="text-3xl font-bold text-brand-secondary">
            {formatCurrency(inversion)}
          </p>
        )}
      </div>

      {/* Ahorro neto — el gancho */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-6 text-white shadow-xl transition-transform duration-300 hover:scale-[1.03]">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Ahorro Operativo Neto
          </p>
          <p className="mb-2 text-xs text-white/70">Impacto directo a utilidades</p>
        </div>
        <p className="text-4xl font-black drop-shadow-md">
          {formatCurrency(ahorro)}
        </p>
        <div
          className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-inner ${
            roiPositivo ? 'bg-brand-accent' : 'bg-brand-dark'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          ROI {roi}%
        </div>
      </div>
    </div>
  );
}
