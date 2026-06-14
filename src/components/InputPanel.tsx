import { Building2, Settings2, Syringe } from 'lucide-react';
import { Field } from './ui/Field';
import type { UseRoiCalculator } from '../hooks/useRoiCalculator';

type InputPanelProps = Pick<
  UseRoiCalculator,
  'empresa' | 'enfermedades' | 'setEmpresaCampo' | 'setEnfermedadCampo'
>;

export function InputPanel({
  empresa,
  enfermedades,
  setEmpresaCampo,
  setEnfermedadCampo,
}: InputPanelProps) {
  return (
    <section className="no-print order-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl sm:p-6 lg:order-1 lg:col-span-4">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Building2 className="h-5 w-5 text-brand-secondary" />
        Parámetros del Cliente
      </h2>

      <div className="space-y-5">
        <Field
          type="text"
          label="Nombre Empresa"
          value={empresa.empresa}
          onChange={(v) => setEmpresaCampo('empresa', v)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            type="number"
            label="Total Empleados"
            value={empresa.numEmpleados}
            min={1}
            onChange={(v) => setEmpresaCampo('numEmpleados', v)}
          />
          <Field
            type="number"
            label="Costo Hora Prom."
            prefix="$"
            value={empresa.costoHora}
            min={0}
            onChange={(v) => setEmpresaCampo('costoHora', v)}
          />
        </div>

        <Field
          type="number"
          label="Horas por Jornada"
          value={empresa.horasJornada}
          min={1}
          max={24}
          suffix="hrs"
          onChange={(v) => setEmpresaCampo('horasJornada', v)}
        />
      </div>

      <div className="my-6 border-t border-slate-100" />

      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Settings2 className="h-5 w-5 text-brand-secondary" />
        Supuestos por Enfermedad
      </h2>

      <div className="space-y-5">
        {enfermedades.map((enf, i) => (
          <div
            key={enf.nombre}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-primary">
              <Syringe className="h-4 w-4" />
              {enf.nombre}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field
                type="number"
                label="Tasa Contagio"
                suffix="%"
                step={1}
                min={0}
                max={100}
                value={Math.round(enf.tasaContagio * 100)}
                onChange={(v) => setEnfermedadCampo(i, 'tasaContagio', v / 100)}
              />
              <Field
                type="number"
                label="Días Ausencia"
                value={enf.diasAusencia}
                min={0}
                onChange={(v) => setEnfermedadCampo(i, 'diasAusencia', v)}
              />
              <Field
                type="number"
                label="Costo Dosis"
                prefix="$"
                value={enf.costoDosis}
                min={0}
                onChange={(v) => setEnfermedadCampo(i, 'costoDosis', v)}
              />
              <Field
                type="number"
                label="Efectividad"
                suffix="%"
                step={1}
                min={0}
                max={100}
                value={Math.round(enf.efectividad * 100)}
                onChange={(v) => setEnfermedadCampo(i, 'efectividad', v / 100)}
              />
              <Field
                className="col-span-2"
                type="number"
                label="% Plantilla en Riesgo (a vacunar)"
                suffix="%"
                step={1}
                min={0}
                max={100}
                value={Math.round(enf.pctPoblacionRiesgo * 100)}
                onChange={(v) =>
                  setEnfermedadCampo(i, 'pctPoblacionRiesgo', v / 100)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
