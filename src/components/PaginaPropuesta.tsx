// ---------------------------------------------------------------------------
// Propuesta de retorno de la inversión: /propuesta?c=...
//
// El anexo de la cotización para un prospecto calificado. Recibe el mismo
// enlace que /cotizacion —mismo folio, mismos renglones— y enseña qué gana la
// empresa con esa campaña.
//
// Es de SÓLO LECTURA a propósito. No hay un solo campo: si el prospecto o el
// vendedor pudieran mover los supuestos, el retorno dejaría de ser de
// Leucotec. Si el cliente quiere otra cantidad, eso es otra cotización.
//
// No pasa por el registro de la entrada: quien la abre ya es prospecto.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, FileWarning, Lock, Printer, Scale } from 'lucide-react';
import { AnalysisSequence } from './AnalysisSequence';
import { KpiCards } from './KpiCards';
import { RiskChart } from './RiskChart';
import { PredictiveAlert } from './PredictiveAlert';
import { formatCurrency, formatNumber } from '../lib/calculations';
import { leerCotizacionImprimible } from '../lib/cotizacionImprimible';
import { propuestaDesdeCotizacion } from '../lib/propuestaRoi';

const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

const fechaLarga = (d: Date) =>
  d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

export function PaginaPropuesta() {
  const cotizacion = useMemo(() => leerCotizacionImprimible(), []);
  const propuesta = useMemo(
    () => (cotizacion ? propuestaDesdeCotizacion(cotizacion) : null),
    [cotizacion],
  );

  const [analizando, setAnalizando] = useState(true);
  const terminar = useCallback(() => setAnalizando(false), []);

  useEffect(() => {
    if (!cotizacion) return;
    const cliente = cotizacion.cliente ? ` ${cotizacion.cliente}` : '';
    document.title = `Retorno de la inversión${cliente} ${cotizacion.folio}`;
  }, [cotizacion]);

  if (!cotizacion || !propuesta || propuesta.resultado.dosisTotales <= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <FileWarning className="mx-auto h-10 w-10 text-brand-primary" />
          <h1 className="mt-4 text-lg font-bold text-brand-dark">No hay propuesta que mostrar</h1>
          <p className="mt-2 text-sm text-slate-500">
            El enlace llegó sin datos o incompleto. Pídele a tu ejecutivo de Leucotec que te lo
            envíe de nuevo.
          </p>
        </div>
      </div>
    );
  }

  const { empresa, enfermedades, resultado, totalCotizacion, costoDiaCapturado, sinModelo } =
    propuesta;

  if (analizando) {
    return <AnalysisSequence empresa={empresa} enfermedades={enfermedades} onListo={terminar} />;
  }

  // El retorno se argumenta sobre lo que el cliente va a firmar. Si algún día
  // no cuadra, es un error del cálculo y la página lo dice en vez de esconderlo.
  const cuadra = Math.abs(resultado.inversionTotal - totalCotizacion) < 0.5;
  const enlaceCotizacion = `/cotizacion${window.location.search}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-800">
      {/* ---------------- Barra superior ---------------- */}
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-leucotec.png" alt="Grupo Leucotec" className="h-7 w-auto sm:h-9" />
            <div className="hidden border-l border-slate-200 pl-3 sm:block">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-dark">
                Retorno de la inversión
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Anexo a la cotización {cotizacion.folio}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={enlaceCotizacion}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-dark transition-colors hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Ver cotización</span>
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        {/* ---------------- Portada ---------------- */}
        <section className="relative overflow-hidden rounded-2xl bg-brand-dark p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-primary opacity-20 blur-3xl" />
          <img
            src="/logo-leucotec.png"
            alt="Grupo Leucotec"
            className="mb-5 hidden h-8 w-auto brightness-0 invert print:block"
          />
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
            Propuesta de retorno de la inversión
          </p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{empresa.empresa}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            Qué le cuesta hoy a su empresa no vacunar, y qué recupera al año con la campaña
            cotizada: {formatNumber(resultado.dosisTotales)} dosis de{' '}
            {enfermedades.map((e) => e.nombre).join(', ')}.
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <div>
              <dt className="text-white/50">Cotización</dt>
              <dd className="font-bold">{cotizacion.folio}</dd>
            </div>
            <div>
              <dt className="text-white/50">Fecha</dt>
              <dd className="font-bold">{fechaLarga(new Date())}</dd>
            </div>
            <div>
              <dt className="text-white/50">Plantilla analizada</dt>
              <dd className="font-bold">{formatNumber(empresa.numEmpleados)} personas</dd>
            </div>
          </dl>
        </section>

        <KpiCards resultado={resultado} />

        {/* ---------------- Cuadre con la cotización ---------------- */}
        <section
          className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${
            cuadra ? 'border-emerald-500 bg-emerald-50' : 'border-amber-400 bg-amber-50'
          }`}
        >
          <Scale className={`mt-0.5 h-5 w-5 shrink-0 ${cuadra ? 'text-emerald-600' : 'text-amber-500'}`} />
          <p className={`text-xs leading-relaxed ${cuadra ? 'text-emerald-800' : 'text-amber-800'}`}>
            {cuadra ? (
              <>
                <strong>La inversión de este análisis es el total de su cotización</strong>{' '}
                {cotizacion.folio}: {formatCurrency(totalCotizacion)} antes de IVA. El retorno se
                calcula sobre lo mismo que usted firma.
              </>
            ) : (
              <>
                <strong>Este análisis no cuadra con la cotización {cotizacion.folio}.</strong> Pídale
                a su ejecutivo que lo revise antes de tomar una decisión con estos números.
              </>
            )}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <RiskChart resultado={resultado} />
            <PredictiveAlert empresa={empresa.empresa} resultado={resultado} />
          </div>

          {/* ---------------- Cómo se lee ---------------- */}
          <aside className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl lg:col-span-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-brand-dark">Cómo se calcula</h3>
            {[
              ['Pérdida proyectada', 'Casos esperados al año por los días que cada caso se ausenta y lo que cuesta atenderlo.'],
              ['Inversión', 'El total de la cotización. Si aplica, se descuenta el ISR que se recupera al deducirla como previsión social.'],
              ['Amortización', 'Las vacunas que protegen varios años se reparten en esos años: se compara un año de beneficio contra un año de costo.'],
              ['Ahorro neto', 'La pérdida que la vacuna evita, según su efectividad, menos el costo anual de la protección.'],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="text-xs font-bold text-slate-700">{t}</p>
                <p className="text-xs leading-relaxed text-slate-500">{d}</p>
              </div>
            ))}
          </aside>
        </div>

        {/* ---------------- Supuestos ---------------- */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="text-lg font-bold text-brand-dark">Supuestos del análisis</h3>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3 w-3" />
              Fijos para esta propuesta: no se ajustan por cliente.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Vacuna</th>
                  <th className="py-2 pr-3 text-right font-semibold">Personas</th>
                  <th className="py-2 pr-3 text-right font-semibold">Inversión</th>
                  <th className="py-2 pr-3 text-right font-semibold">Contagio anual</th>
                  <th className="py-2 pr-3 text-right font-semibold">Días por caso</th>
                  <th className="py-2 pr-3 text-right font-semibold">Costo médico</th>
                  <th className="py-2 pr-3 text-right font-semibold">Efectividad</th>
                  <th className="py-2 text-right font-semibold">Protege</th>
                </tr>
              </thead>
              <tbody>
                {enfermedades.map((e, i) => {
                  const d = resultado.detalle[i];
                  // Un producto sin modelo de riesgo no tiene supuestos que enseñar.
                  const sinDatos = sinModelo.includes(e.producto);
                  const s = (v: string) => (sinDatos ? '—' : v);
                  return (
                    <tr key={e.nombre} className="border-b border-slate-100 align-top">
                      <td className="py-2.5 pr-3">
                        <p className="font-bold text-slate-700">{e.nombre}</p>
                        {e.producto !== e.nombre && (
                          <p className="text-[11px] text-slate-400">{e.producto}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatNumber(d.poblacionRiesgo)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatCurrency(d.inversionVacunas)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{s(pct(e.tasaContagio))}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{s(String(e.diasAusencia))}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{s(formatCurrency(e.costoMedicoPorCaso))}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{s(pct(e.efectividad))}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        {s(`${e.aniosProteccion} ${e.aniosProteccion === 1 ? 'año' : 'años'}`)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-slate-400">Costo de un día de ausencia</dt>
              <dd className="mt-0.5 font-bold text-slate-700">{formatCurrency(empresa.costoDiaEmpleado)}</dd>
              <dd className="text-[11px] text-slate-400">
                {costoDiaCapturado
                  ? 'Dato de su empresa.'
                  : 'Referencia: sueldo de ~$21,000 al mes con carga social.'}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-slate-400">Beneficio fiscal</dt>
              <dd className="mt-0.5 font-bold text-slate-700">
                {empresa.aplicarBeneficioFiscal
                  ? `${pct(empresa.pctDeducible)} deducible · ISR ${pct(empresa.tasaISR)}`
                  : 'No aplicado'}
              </dd>
              <dd className="text-[11px] text-slate-400">Previsión social, art. 28 fr. XXX LISR.</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-slate-400">Operación de la campaña</dt>
              <dd className="mt-0.5 font-bold text-slate-700">
                {resultado.logisticaCobrada ? formatCurrency(resultado.logistica.total) : 'Incluida'}
              </dd>
              <dd className="text-[11px] text-slate-400">Enfermería, traslado, insumos y RPBI.</dd>
            </div>
          </dl>

          {sinModelo.length > 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700">
              {sinModelo.join(', ')} {sinModelo.length === 1 ? 'entra' : 'entran'} al análisis sólo como
              inversión: no {sinModelo.length === 1 ? 'tiene' : 'tienen'} un modelo de riesgo laboral,
              así que no suma ahorro. El retorno real es igual o mayor al que se muestra.
            </p>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Análisis ilustrativo con base en supuestos promedio. No constituye asesoría fiscal; confirme
            el tratamiento de la deducción con su área contable. Montos en pesos mexicanos, antes de IVA.
          </p>
        </section>

        <footer className="flex items-center justify-center gap-2 pb-4 text-[11px] text-slate-400">
          <span>Grupo Leucotec · Cotización {cotizacion.folio}</span>
        </footer>
      </main>
    </div>
  );
}
