import { useState } from 'react';
import { ChevronDown, TableProperties } from 'lucide-react';

/**
 * Referencia de inmunización para adultos por rango de edad.
 * Sirve para justificar ante el CFO el campo "% plantilla en riesgo":
 * de aquí sale, por ejemplo, que Herpes Zóster se dirija a mayores de 50.
 *
 * Fuente: presentación de servicios de vacunación Leucotec 2026.
 */
const FILAS: { edad: string; vacunas: string; destacar?: string }[] = [
  {
    edad: '19 – 26',
    vacunas: 'Influenza, Td/DPT, VPH, Hepatitis A/B, MMR, Varicela',
    destacar: 'VPH',
  },
  {
    edad: '27 – 49',
    vacunas: 'Influenza, Td/DPT, Hepatitis A/B',
  },
  {
    edad: '50 – 59',
    vacunas: 'Influenza, Td/DPT, Herpes Zóster, Hepatitis A/B',
    destacar: 'Herpes Zóster',
  },
  {
    edad: '60 – 64',
    vacunas: 'Influenza, Td/DPT, Herpes Zóster',
    destacar: 'Herpes Zóster',
  },
  {
    edad: '65 +',
    vacunas: 'Influenza, Td/DPT, Neumococo, Herpes Zóster',
    destacar: 'Neumococo',
  },
];

const NOTAS = [
  'Influenza: cada año, sin importar la edad. Aplica a toda la plantilla.',
  'Herpes Zóster: desde los 50 años, incluso si la persona ya tuvo culebrilla.',
  'Neumococo: existen dos esquemas (PCV13 conjugada y PPSV23 polisacárido). En campaña corporativa Leucotec suele ofrecerse a toda la plantilla adulta, no sólo a 65+.',
  'VPH: recomendada hasta los 26 años, en mujeres y hombres.',
  'Embarazo: la vacuna DPT se aplica en el tercer trimestre de cada embarazo.',
];

export function ReferenciaEdades() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-xl">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 p-6 text-left"
      >
        <TableProperties className="h-5 w-5 shrink-0 text-brand-secondary" />
        <span className="flex-1">
          <span className="block text-lg font-bold text-brand-dark">
            ¿De dónde sale el % de plantilla?
          </span>
          <span className="block text-xs text-slate-400">
            Recomendación de inmunización para adultos por edad
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierto && (
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="whitespace-nowrap py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Edad
                  </th>
                  <th className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vacunas recomendadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {FILAS.map((f) => (
                  <tr key={f.edad} className="border-b border-slate-100">
                    <td className="whitespace-nowrap py-2.5 pr-4 font-bold text-brand-dark">
                      {f.edad}
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {f.destacar
                        ? f.vacunas.split(', ').map((v, i, arr) => (
                            <span key={v}>
                              <span
                                className={
                                  v === f.destacar
                                    ? 'font-bold text-brand-primary'
                                    : undefined
                                }
                              >
                                {v}
                              </span>
                              {i < arr.length - 1 && ', '}
                            </span>
                          ))
                        : f.vacunas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-1.5">
            {NOTAS.map((n) => (
              <li
                key={n}
                className="flex gap-2 text-[11px] leading-snug text-slate-500"
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-primary" />
                {n}
              </li>
            ))}
          </ul>

          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            Fuente: presentación de servicios de vacunación Grupo Leucotec 2026.
          </p>
        </div>
      )}
    </div>
  );
}
