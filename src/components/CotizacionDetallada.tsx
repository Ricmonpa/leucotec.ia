// ---------------------------------------------------------------------------
// Cotización formal de la campaña.
//
// Es lo que sale al exportar el PDF, después del análisis de ROI: primero se
// argumenta el retorno y al final se entrega el documento que el cliente firma.
//
// La idea, tal como la pidió Martín, es que se vea TODO lo que se entrega:
// cuántas enfermeras, cuántas jornadas, cuántas torundas, el traslado, el
// manejo de RPBI. Que la lista misma demuestre el trabajo que hay detrás.
//
// Sobre los precios: se enumera todo siempre, pero sólo lleva importe lo que
// de verdad se le factura al cliente. Cuando Leucotec absorbe la operación
// —que es lo normal— esas líneas dicen "Incluido". Así el cliente ve el
// alcance completo sin que se le expongan los costos internos de Leucotec.
// ---------------------------------------------------------------------------

import { formatCurrency, formatNumber } from '../lib/calculations';
import type {
  ParametrosEmpresa,
  ParametrosEnfermedad,
  ResultadoSimulacion,
} from '../lib/calculations';
import {
  INSUMOS_APLICACION,
  MANEJO_RPBI,
  cantidadInsumo,
  unidadDe,
} from '../lib/insumosCatalogo';

interface CotizacionDetalladaProps {
  empresa: ParametrosEmpresa;
  enfermedades: ParametrosEnfermedad[];
  resultado: ResultadoSimulacion;
  /** Folio de la cotización. Si no viene, se arma con la fecha. */
  folio?: string;
}

const hoy = () =>
  new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

/** La cotización vence a los 30 días: es lo que aguanta un precio de biológico. */
function vigencia(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function folioDeFecha(): string {
  const d = new Date();
  const s = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
  return `COT-${s}`;
}

/** Encabezado de sección, con su número. */
function Seccion({ n, titulo }: { n: number; titulo: string }) {
  return (
    <h3 className="mb-2 mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-dark">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white">
        {n}
      </span>
      {titulo}
    </h3>
  );
}

const th = 'border-b border-slate-300 px-2 py-1.5 text-left font-bold text-slate-500';
const td = 'border-b border-slate-100 px-2 py-1.5 align-top';
const num = 'text-right tabular-nums';

export function CotizacionDetallada({
  empresa,
  enfermedades,
  resultado,
  folio,
}: CotizacionDetalladaProps) {
  const cobra = empresa.cobrarLogistica;
  const activas = enfermedades.filter((e) => e.activa);
  const { logistica } = resultado;

  // Cada renglón de biológico: a cuánta gente y a qué precio.
  const lineas = activas.map((e) => {
    const det = resultado.detalle.find((d) => d.nombre === e.nombre);
    const personas = det?.poblacionRiesgo ?? 0;
    return {
      enfermedad: e.nombre,
      producto: e.producto,
      personas,
      precio: e.costoDosis,
      importe: personas * e.costoDosis,
      anios: e.aniosProteccion,
    };
  });

  /** Importe si se cobra; la palabra "Incluido" si Leucotec lo absorbe. */
  const importe = (v: number) =>
    cobra ? formatCurrency(v) : <span className="text-slate-400">Incluido</span>;

  return (
    <section className="solo-print text-[10px] leading-snug text-slate-700">
      {/* ---- Encabezado ---- */}
      <div className="mb-5 flex items-start justify-between gap-6 border-b-2 border-brand-primary pb-3">
        <div className="flex items-center gap-3">
          <img src="/logo-leucotec.png" alt="Grupo Leucotec" className="h-10 w-auto" />
          <div>
            <p className="text-lg font-bold uppercase tracking-wide text-brand-dark">
              Cotización
            </p>
            <p className="text-[10px] text-slate-400">
              Campaña de vacunación corporativa
            </p>
          </div>
        </div>
        <table className="text-[10px]">
          <tbody>
            <tr>
              <td className="pr-3 text-slate-400">Folio</td>
              <td className="font-bold">{folio ?? folioDeFecha()}</td>
            </tr>
            <tr>
              <td className="pr-3 text-slate-400">Fecha</td>
              <td>{hoy()}</td>
            </tr>
            <tr>
              <td className="pr-3 text-slate-400">Vigencia</td>
              <td>{vigencia()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---- Cliente ---- */}
      <div className="flex gap-8 rounded-lg bg-slate-50 px-3 py-2">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-400">Cliente</p>
          <p className="text-sm font-bold text-brand-dark">
            {empresa.empresa || 'Por definir'}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-400">Plantilla</p>
          <p className="text-sm font-bold text-brand-dark">
            {formatNumber(empresa.numEmpleados)} empleados
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-400">
            Dosis a aplicar
          </p>
          <p className="text-sm font-bold text-brand-dark">
            {formatNumber(logistica.dosisTotales)}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-400">
            {logistica.sedes.length > 1 ? 'Sedes' : 'Sede'}
          </p>
          <p className="text-sm font-bold text-brand-dark">
            {logistica.sedes.map((s) => s.destino || 'Por definir').join(' · ')}
          </p>
        </div>
      </div>

      {/* ---- 1. Biológicos ---- */}
      <Seccion n={1} titulo="Biológicos" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Vacuna</th>
            <th className={th}>Producto</th>
            <th className={`${th} ${num}`}>Dosis</th>
            <th className={`${th} ${num}`}>P. unitario</th>
            <th className={`${th} ${num}`}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l) => (
            <tr key={l.enfermedad}>
              <td className={td}>
                <span className="font-bold text-brand-dark">{l.enfermedad}</span>
                {l.anios > 1 && (
                  <span className="ml-1 text-slate-400">
                    {'·'} protege {l.anios} años
                  </span>
                )}
              </td>
              <td className={td}>{l.producto}</td>
              <td className={`${td} ${num}`}>{formatNumber(l.personas)}</td>
              <td className={`${td} ${num}`}>{formatCurrency(l.precio)}</td>
              <td className={`${td} ${num} font-bold`}>{formatCurrency(l.importe)}</td>
            </tr>
          ))}
          <tr>
            <td className="px-2 py-1.5 font-bold text-brand-dark" colSpan={4}>
              Subtotal biológicos
            </td>
            <td className={`px-2 py-1.5 font-bold text-brand-dark ${num}`}>
              {formatCurrency(resultado.inversionVacunasTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ---- 2. Servicio de aplicación, sede por sede ---- */}
      <Seccion n={2} titulo="Servicio de aplicación" />
      {logistica.sedes.map((s, i) => (
        <div key={i} className="mb-3">
          {logistica.sedes.length > 1 && (
            <p className="mb-1 text-[10px] font-bold text-brand-dark">
              Sede {i + 1}
              {s.destino ? ` · ${s.destino}` : ''}
              <span className="ml-1 font-normal text-slate-400">
                {' '}({formatNumber(s.dosis)} dosis)
              </span>
            </p>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Concepto</th>
                <th className={th}>Detalle</th>
                <th className={`${th} ${num}`}>Cantidad</th>
                <th className={`${th} ${num}`}>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Personal de enfermería</td>
                <td className={td}>
                  {s.enfermerasPorDia}{' '}
                  {s.enfermerasPorDia === 1 ? 'enfermera' : 'enfermeras'} por{' '}
                  {s.diasVacunacion}{' '}
                  {s.diasVacunacion === 1 ? 'jornada' : 'jornadas'} ·{' '}
                  {s.foranea
                    ? 'sede foránea'
                    : s.jornadaLarga
                      ? 'jornada de más de 4 horas'
                      : 'jornada de 1 a 4 horas'}
                </td>
                <td className={`${td} ${num}`}>
                  {s.turnos} {s.turnos === 1 ? 'turno' : 'turnos'}
                </td>
                <td className={`${td} ${num}`}>{importe(s.enfermeras)}</td>
              </tr>
              {s.transporte > 0 && (
                <tr>
                  <td className={td}>Traslado del equipo</td>
                  <td className={td}>
                    {s.foranea
                      ? 'Viaje a la sede foránea, ida y vuelta'
                      : 'Traslado del personal y del equipo'}
                  </td>
                  <td className={`${td} ${num}`}>1</td>
                  <td className={`${td} ${num}`}>{importe(s.transporte)}</td>
                </tr>
              )}
              {s.comidas > 0 && (
                <tr>
                  <td className={td}>Alimentación del equipo</td>
                  <td className={td}>Durante las jornadas de vacunación</td>
                  <td className={`${td} ${num}`}>1</td>
                  <td className={`${td} ${num}`}>{importe(s.comidas)}</td>
                </tr>
              )}
              {s.pruebaCovid > 0 && (
                <tr>
                  <td className={td}>Prueba COVID al personal</td>
                  <td className={td}>
                    Tamizaje del equipo antes de entrar a sus instalaciones
                  </td>
                  <td className={`${td} ${num}`}>1</td>
                  <td className={`${td} ${num}`}>{importe(s.pruebaCovid)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {/* ---- 3. Insumos y RPBI ---- */}
      <Seccion n={3} titulo="Insumos de aplicación y manejo de RPBI" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Insumo</th>
            <th className={th}>Rendimiento</th>
            <th className={`${th} ${num}`}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {INSUMOS_APLICACION.map((ins) => {
            const cantidad = cantidadInsumo(ins, logistica.dosisTotales);
            return (
              <tr key={ins.nombre}>
                <td className={td}>{ins.nombre}</td>
                <td className={td}>
                  {ins.porDosis >= 1
                    ? `${ins.porDosis} ${unidadDe(ins, ins.porDosis)} por dosis`
                    : `1 ${ins.unidad} por cada ${Math.round(1 / ins.porDosis)} dosis`}
                </td>
                <td className={`${td} ${num}`}>
                  {formatNumber(cantidad)} {unidadDe(ins, cantidad)}
                </td>
              </tr>
            );
          })}
          {MANEJO_RPBI.map((r) => (
            <tr key={r.nombre}>
              <td className={td}>{r.nombre}</td>
              <td className={td}>{r.detalle}</td>
              <td className={`${td} ${num}`}>
                {logistica.sedes.length > 1
                  ? `${logistica.sedes.length} sedes`
                  : 'Incluido'}
              </td>
            </tr>
          ))}
          <tr>
            <td className="px-2 py-1.5 font-bold text-brand-dark" colSpan={2}>
              Insumos y manejo de RPBI
            </td>
            <td className={`px-2 py-1.5 font-bold text-brand-dark ${num}`}>
              {importe(logistica.insumos)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ---- Total ---- */}
      <div className="mt-6 flex justify-end">
        <table className="w-1/2 border-collapse">
          <tbody>
            <tr>
              <td className="px-2 py-1 text-slate-500">Biológicos</td>
              <td className={`px-2 py-1 ${num}`}>
                {formatCurrency(resultado.inversionVacunasTotal)}
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-slate-500">
                Servicio de aplicación, insumos y RPBI
              </td>
              <td className={`px-2 py-1 ${num}`}>
                {cobra ? formatCurrency(logistica.total) : (
                  <span className="text-slate-400">Sin costo</span>
                )}
              </td>
            </tr>
            <tr className="bg-brand-dark text-white">
              <td className="px-2 py-2 text-sm font-bold">Total de la campaña</td>
              <td className={`px-2 py-2 text-sm font-bold ${num}`}>
                {formatCurrency(resultado.inversionTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---- Condiciones ---- */}
      <Seccion n={4} titulo="Condiciones" />
      <ul className="ml-4 list-disc space-y-1 text-[9.5px] text-slate-500">
        <li>Precios en pesos mexicanos. No incluyen IVA.</li>
        <li>
          Vigencia de la cotización: 30 días naturales. El precio del biológico
          está sujeto a disponibilidad del laboratorio.
        </li>
        {!cobra && (
          <li>
            El servicio de aplicación, los insumos y el manejo de RPBI van{' '}
            <strong>incluidos sin costo adicional</strong>: se cobra únicamente
            el biológico.
          </li>
        )}
        <li>
          Los residuos peligrosos biológico-infecciosos se manejan conforme a la
          NOM-087-SEMARNAT-SSA1-2002, con recolección por empresa autorizada y
          entrega del manifiesto correspondiente.
        </li>
        <li>
          El pago con tarjeta causa un cargo adicional por comisión bancaria.
        </li>
        <li>
          La programación de las jornadas se confirma con al menos 5 días
          hábiles de anticipación.
        </li>
        {logistica.sedes.length > 1 && (
          <li>
            La campaña contempla {logistica.sedes.length} sedes. Cada una lleva
            su propio equipo, por lo que pueden operar de forma simultánea.
          </li>
        )}
      </ul>

      <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-3">
        <p className="text-[9px] text-slate-400">
          Grupo Leucotec · Salud preventiva corporativa
        </p>
        <p className="text-[9px] text-slate-300">
          Cotización generada con el simulador de N3 Thinktech IA Laboratory
        </p>
      </div>
    </section>
  );
}
