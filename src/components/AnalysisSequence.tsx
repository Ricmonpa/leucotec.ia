import { useEffect, useState } from 'react';
import { Check, Cpu, Loader2 } from 'lucide-react';
import type { ParametrosEmpresa, ParametrosEnfermedad } from '../lib/calculations';
import { formatNumber } from '../lib/calculations';

/**
 * Secuencia de arranque del análisis.
 *
 * Los pasos NO son decorativos: son las etapas reales del motor de cálculo,
 * en el mismo orden en que se ejecutan. Sirve para dos cosas a la vez —
 * dar peso al momento del resultado, y dejar ver la lógica al prospecto.
 *
 * Sólo corre al iniciar (o al pedir un nuevo análisis). Las ediciones en vivo
 * siguen siendo instantáneas: ahí está el valor de la herramienta.
 */

const DURACION_PASO = 380;

interface AnalysisSequenceProps {
  empresa: ParametrosEmpresa;
  enfermedades: ParametrosEnfermedad[];
  onListo: () => void;
}

export function AnalysisSequence({
  empresa,
  enfermedades,
  onListo,
}: AnalysisSequenceProps) {
  const activas = enfermedades.filter((e) => e.activa);

  const pasos = [
    `Leyendo plantilla de ${formatNumber(empresa.numEmpleados)} empleados`,
    `Estimando población en riesgo para ${activas.length} vacunas`,
    'Proyectando casos esperados por enfermedad',
    'Valuando días de inactividad operativa',
    empresa.aplicarBeneficioFiscal
      ? 'Aplicando deducción por previsión social'
      : 'Contrastando inversión contra pérdida evitada',
    'Consolidando Ahorro Neto y ROI',
  ];

  const [paso, setPaso] = useState(0);

  useEffect(() => {
    const sinMovimiento = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (sinMovimiento) {
      onListo();
      return;
    }

    if (paso >= pasos.length) {
      const fin = setTimeout(onListo, 260);
      return () => clearTimeout(fin);
    }

    const siguiente = setTimeout(() => setPaso((p) => p + 1), DURACION_PASO);
    return () => clearTimeout(siguiente);
  }, [paso, pasos.length, onListo]);

  const avance = Math.round((paso / pasos.length) * 100);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
            <Cpu className="h-5 w-5 text-brand-primary" />
            <span className="absolute inset-0 animate-ping rounded-xl bg-brand-primary/20" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-dark">Motor de análisis</p>
            <p className="truncate text-xs text-slate-400">{empresa.empresa}</p>
          </div>
        </div>

        {/* Barra de avance */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark transition-all duration-300 ease-out"
            style={{ width: `${avance}%` }}
          />
        </div>

        <ul className="space-y-2.5">
          {pasos.map((texto, i) => {
            const hecho = i < paso;
            const corriendo = i === paso;

            return (
              <li
                key={texto}
                className={`flex items-start gap-2.5 text-xs leading-snug transition-colors duration-200 ${
                  hecho
                    ? 'text-slate-400'
                    : corriendo
                      ? 'font-semibold text-brand-dark'
                      : 'text-slate-300'
                }`}
              >
                <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  {hecho ? (
                    <Check className="h-3.5 w-3.5 text-brand-accent" />
                  ) : corriendo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                  )}
                </span>
                {texto}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
