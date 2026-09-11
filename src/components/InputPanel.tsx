import { Building2, Landmark, Settings2, Syringe, Truck } from 'lucide-react';
import { CalculadoraCostoDia } from './CalculadoraCostoDia';
import { productosDe } from '../lib/catalogoProductos';
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
            label="Costo Día de Ausencia"
            prefix="$"
            value={empresa.costoDiaEmpleado}
            min={0}
            onChange={(v) => setEmpresaCampo('costoDiaEmpleado', v)}
          />
        </div>

        <p className="-mt-2 text-[11px] leading-snug text-slate-400">
          Lo que le cuesta a la empresa que esa persona no esté —{' '}
          <strong className="text-slate-500">no es el sueldo diario</strong>.
          Incluye carga social y el costo de cubrir el hueco.
        </p>

        <CalculadoraCostoDia
          onAplicar={(v) => setEmpresaCampo('costoDiaEmpleado', v)}
        />
      </div>

      <div className="my-6 border-t border-slate-100" />

      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Landmark className="h-5 w-5 text-brand-secondary" />
        Beneficio Fiscal
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        La vacunación al personal es deducible como previsión social
        (Art. 7 y 93 LISR).
      </p>

      <div
        className={`rounded-xl border p-4 transition-colors ${
          empresa.aplicarBeneficioFiscal
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-slate-100 bg-white'
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setEmpresaCampo('aplicarBeneficioFiscal', !empresa.aplicarBeneficioFiscal)
          }
          aria-pressed={empresa.aplicarBeneficioFiscal}
          className="flex w-full items-center gap-2 text-left"
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              empresa.aplicarBeneficioFiscal ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                empresa.aplicarBeneficioFiscal ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
          <span
            className={`text-sm font-bold ${
              empresa.aplicarBeneficioFiscal ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            Aplicar deducción de previsión social
          </span>
        </button>

        {empresa.aplicarBeneficioFiscal && (
          <>
            <p className="mb-3 mt-2 border-l-2 border-emerald-200 pl-2 text-[11px] leading-snug text-slate-500">
              El gasto reduce la base gravable, no el impuesto directo. El flujo
              recuperado es <strong>gasto deducible × tasa de ISR</strong>. Requiere
              aplicarse a toda la plantilla bajo los mismos criterios y pagarse
              por medios rastreables.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                type="number"
                label="% Deducible"
                suffix="%"
                step={1}
                min={0}
                max={100}
                hint="47% o 53% según Art. 28 fr. XXX"
                value={Math.round(empresa.pctDeducible * 100)}
                onChange={(v) => setEmpresaCampo('pctDeducible', v / 100)}
              />
              <Field
                type="number"
                label="Tasa ISR"
                suffix="%"
                step={1}
                min={0}
                max={100}
                hint="ISR corporativo en México"
                value={Math.round(empresa.tasaISR * 100)}
                onChange={(v) => setEmpresaCampo('tasaISR', v / 100)}
              />
            </div>
          </>
        )}
      </div>

      <div className="my-6 border-t border-slate-100" />

      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Truck className="h-5 w-5 text-brand-secondary" />
        Logística de Campaña
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Enfermeras, insumos y recolección de RPBI. Normalmente Leucotec los
        absorbe y no aparecen en la cotización; enciéndelo sólo si a este
        cliente se le cobran aparte.
      </p>

      <div
        className={`rounded-xl border p-4 transition-colors ${
          empresa.cobrarLogistica
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-100 bg-white'
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setEmpresaCampo('cobrarLogistica', !empresa.cobrarLogistica)
          }
          aria-pressed={empresa.cobrarLogistica}
          className="flex w-full items-center gap-2 text-left"
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              empresa.cobrarLogistica ? 'bg-brand-primary' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                empresa.cobrarLogistica ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
          <span
            className={`text-sm font-bold ${
              empresa.cobrarLogistica ? 'text-brand-primary' : 'text-slate-400'
            }`}
          >
            Cobrar logística al cliente
          </span>
        </button>

        <div className="mt-3 space-y-3">
            <button
              type="button"
              onClick={() => setEmpresaCampo('sedeForanea', !empresa.sedeForanea)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left"
            >
              <span className="text-xs font-semibold text-slate-600">Sede</span>
              <span className="text-sm font-bold text-brand-primary">
                {empresa.sedeForanea ? 'Foránea' : 'Local'}
              </span>
            </button>

            {!empresa.sedeForanea && (
              <button
                type="button"
                onClick={() => setEmpresaCampo('jornadaLarga', !empresa.jornadaLarga)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left"
              >
                <span className="text-xs font-semibold text-slate-600">
                  Horas por jornada
                </span>
                <span className="text-sm font-bold text-brand-primary">
                  {empresa.jornadaLarga ? 'Más de 4' : '1 a 4'}
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field
                type="number"
                label="Jornadas"
                suffix="días"
                min={1}
                value={empresa.diasVacunacion}
                onChange={(v) => setEmpresaCampo('diasVacunacion', v)}
              />
              <Field
                type="number"
                label="Enfermeras/día"
                min={1}
                value={empresa.enfermerasPorDia}
                onChange={(v) => setEmpresaCampo('enfermerasPorDia', v)}
              />
            </div>

            <Field
              type="number"
              label="Transporte y alimentación"
              prefix="$"
              min={0}
              hint="Camión, taxi o vuelo del equipo, más comidas si aplican"
              value={empresa.viaticos}
              onChange={(v) => setEmpresaCampo('viaticos', v)}
            />

            <p className="text-[10px] leading-snug text-slate-400">
              Estos datos se capturan siempre: aunque no se le cobren al
              cliente, son costo real de la campaña y cuentan para el margen.
              Los insumos salen a $18.07 por dosis, monto que ya incluye los
              botes y el servicio de RPBI. Referencia de comidas: $120
              desayuno, $150 comida, $130 cena.
            </p>
        </div>
      </div>

      <div className="my-6 border-t border-slate-100" />

      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Settings2 className="h-5 w-5 text-brand-secondary" />
        Vacunas de la Campaña
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Activa las vacunas que incluye la propuesta. Sólo las activas suman al ROI.
      </p>

      <div className="space-y-4">
        {enfermedades.map((enf, i) => (
          <div
            key={enf.nombre}
            className={`rounded-xl border p-4 transition-colors ${
              enf.activa
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-100 bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setEnfermedadCampo(i, 'activa', !enf.activa)}
              aria-pressed={enf.activa}
              className="flex w-full items-center gap-2 text-left"
            >
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  enf.activa ? 'bg-brand-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    enf.activa ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
              <Syringe
                className={`h-4 w-4 shrink-0 ${
                  enf.activa ? 'text-brand-primary' : 'text-slate-300'
                }`}
              />
              <span
                className={`text-sm font-bold ${
                  enf.activa ? 'text-brand-primary' : 'text-slate-400'
                }`}
              >
                {enf.nombre}
              </span>
            </button>

            {enf.activa && (
              <>
                <ProductoSelector
                  enfermedad={enf.nombre}
                  producto={enf.producto}
                  onElegir={(nombre, precio) => {
                    setEnfermedadCampo(i, 'producto', nombre);
                    setEnfermedadCampo(i, 'costoDosis', precio);
                  }}
                />

                {enf.nota && (
                  <p className="mb-3 mt-2 border-l-2 border-slate-200 pl-2 text-[11px] leading-snug text-slate-400">
                    {enf.nota}
                  </p>
                )}
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
                label="Años de Protección"
                suffix="años"
                step={1}
                min={1}
                max={30}
                hint="La inversión se amortiza a este plazo"
                value={enf.aniosProteccion}
                onChange={(v) => setEnfermedadCampo(i, 'aniosProteccion', v)}
              />
              <Field
                type="number"
                label="Costo Médico por Caso"
                prefix="$"
                value={enf.costoMedicoPorCaso}
                min={0}
                hint="Consultas, estudios y hospitalización promedio"
                onChange={(v) => setEnfermedadCampo(i, 'costoMedicoPorCaso', v)}
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
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Elige el producto comercial y carga su precio de lista.
 *
 * El vendedor razona en marcas ("Shingrix"), no en categorías clínicas, y así
 * no teclea el precio de memoria. Sigue pudiendo ajustarlo abajo si negocia
 * un precio distinto.
 */
function ProductoSelector({
  enfermedad,
  producto,
  onElegir,
}: {
  enfermedad: string;
  producto: string;
  onElegir: (nombre: string, precio: number) => void;
}) {
  const opciones = productosDe(enfermedad);
  if (opciones.length === 0) return null;

  const actual = opciones.find((o) => o.nombre === producto);

  return (
    <div className="mb-3 mt-3">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Producto
      </label>
      <select
        value={producto}
        onChange={(e) => {
          const elegido = opciones.find((o) => o.nombre === e.target.value);
          if (elegido) onElegir(elegido.nombre, elegido.precio);
        }}
        disabled={opciones.length === 1}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:text-slate-500"
      >
        {opciones.map((o) => (
          <option key={o.nombre} value={o.nombre}>
            {o.nombre}
          </option>
        ))}
      </select>
      {actual?.detalle && (
        <p className="mt-1 text-[10px] text-slate-400">{actual.detalle}</p>
      )}
    </div>
  );
}
