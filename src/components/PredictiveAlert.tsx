import { AlertTriangle } from 'lucide-react';
import { formatNumber, type ResultadoSimulacion } from '../lib/calculations';

interface PredictiveAlertProps {
  empresa: string;
  resultado: ResultadoSimulacion;
}

export function PredictiveAlert({ empresa, resultado }: PredictiveAlertProps) {
  // Se destaca la enfermedad con mayor número de casos proyectados.
  const principal = resultado.detalle.reduce(
    (max, d) => (d.casosProyectados > max.casosProyectados ? d : max),
    resultado.detalle[0],
  );

  if (!principal) return null;

  return (
    <div className="flex items-start gap-4 rounded-r-xl border-l-4 border-amber-400 bg-amber-50 p-4 shadow-sm">
      <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
      <div>
        <h4 className="text-sm font-bold text-amber-800">Alerta Predictiva Leucotec</h4>
        <p className="mt-1 text-xs leading-relaxed text-amber-700">
          Según la demografía de <span className="font-bold">{empresa}</span>, hay
          aproximadamente{' '}
          <span className="font-bold">
            {formatNumber(principal.casosProyectados)} empleados
          </span>{' '}
          altamente susceptibles a contraer {principal.nombre} en el próximo ciclo.
          Intervenir hoy previene{' '}
          <span className="font-bold">
            {formatNumber(principal.diasInactividad)} días
          </span>{' '}
          de inactividad operativa.
        </p>
      </div>
    </div>
  );
}
