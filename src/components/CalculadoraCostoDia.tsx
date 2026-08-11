import { useState } from 'react';
import { Calculator, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../lib/calculations';

/**
 * Deriva el costo de un día de ausencia a partir del sueldo mensual.
 *
 * Existe porque capturar este número "a ojo" fue justo lo que descalibró el
 * modelo: es fácil confundir el costo de la ausencia con el sueldo diario.
 * Aquí el número queda con su origen a la vista y auditable.
 */

/** Días hábiles promedio al mes (250 hábiles al año / 12). */
const DIAS_HABILES_MES = 20.8;

interface CalculadoraCostoDiaProps {
  onAplicar: (costoDia: number) => void;
}

export function CalculadoraCostoDia({ onAplicar }: CalculadoraCostoDiaProps) {
  const [abierta, setAbierta] = useState(false);
  const [sueldo, setSueldo] = useState(21000);
  const [cargaSocial, setCargaSocial] = useState(35);

  const porDiaHabil = sueldo / DIAS_HABILES_MES;
  const costoDia = Math.round(porDiaHabil * (1 + cargaSocial / 100));
  const valido = Number.isFinite(costoDia) && costoDia > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        <Calculator className="h-4 w-4 shrink-0 text-brand-secondary" />
        <span className="flex-1 text-xs font-semibold text-brand-dark">
          Calcular desde el sueldo mensual
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            abierta ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierta && (
        <div className="border-t border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Sueldo mensual
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(sueldo) ? sueldo : ''}
                  onChange={(e) => setSueldo(e.target.valueAsNumber)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-6 pr-2 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Carga social
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={Number.isFinite(cargaSocial) ? cargaSocial : ''}
                  onChange={(e) => setCargaSocial(e.target.valueAsNumber)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-6 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-snug text-slate-500">
            {formatCurrency(sueldo || 0)} ÷ {DIAS_HABILES_MES} días hábiles ×{' '}
            {Number.isFinite(cargaSocial) ? cargaSocial : 0}% de carga ={' '}
            <strong className="text-brand-dark">
              {valido ? formatCurrency(costoDia) : '—'}
            </strong>{' '}
            por día
          </p>

          <button
            type="button"
            disabled={!valido}
            onClick={() => onAplicar(costoDia)}
            className="mt-3 w-full rounded-lg bg-brand-dark py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-primary disabled:opacity-40"
          >
            Aplicar {valido ? formatCurrency(costoDia) : ''}
          </button>

          <p className="mt-2 text-[10px] leading-snug text-slate-400">
            No incluye el costo de cubrir el hueco (tiempo extra, producción
            detenida). Si aplica, súbelo manualmente: sigue siendo legítimo.
          </p>
        </div>
      )}
    </div>
  );
}
