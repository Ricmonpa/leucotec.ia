// ---------------------------------------------------------------------------
// Cotización formal de la campaña.
//
// Es el producto final de todo el proceso de cotizar: lo que el vendedor le
// entrega al cliente. Se llega desde el Sheet de Martin o desde el dashboard,
// pero el documento es uno solo.
//
// Tal como lo pidió Martin, aquí se ve TODO lo que se entrega: cuántas
// enfermeras por cuántas jornadas, el traslado, cada insumo con su cantidad,
// el manejo de RPBI. Cada renglón suma a la propuesta de valor.
//
// Sobre los importes: se enumera todo siempre, pero sólo lleva precio lo que
// de verdad se factura. Cuando Leucotec absorbe la operación —lo normal—
// esas líneas dicen "Incluido": el cliente ve el alcance completo sin que se
// expongan los costos internos.
//
// Todo lo que aparece aquí sale del cotizador de Martin. No se agregan
// servicios que Leucotec no haya confirmado: es un documento que el cliente
// firma.
// ---------------------------------------------------------------------------

import { formatNumber } from '../lib/calculations';
import {
  resumirCotizacion,
  type CotizacionImprimible,
} from '../lib/cotizacionImprimible';
import { INSUMOS_APLICACION, MANEJO_RPBI, cantidadInsumo, unidadDe } from '../lib/insumosCatalogo';

interface CotizacionDetalladaProps {
  cotizacion: CotizacionImprimible;
  className?: string;
}

/** En una cotización los centavos importan: siempre con dos decimales. */
const dinero = (v: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const fechaLarga = (d: Date) =>
  d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

/** 30 días: es lo que aguanta un precio de biológico. */
const DIAS_VIGENCIA = 30;

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/** Une una lista en español: "a", "a y b", "a, b y c". */
function enLista(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;
}

function Seccion({ n, titulo, nota }: { n: number; titulo: string; nota?: string }) {
  return (
    <div className="mb-2 mt-7 flex items-baseline justify-between gap-4 border-b border-slate-200 pb-1.5">
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-dark">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white">
          {n}
        </span>
        {titulo}
      </h3>
      {nota && <span className="text-[9px] text-slate-400">{nota}</span>}
    </div>
  );
}

function Dato({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        fuerte ? 'bg-brand-dark text-white' : 'border border-slate-200 bg-white'
      }`}
    >
      <p className={`text-[8.5px] uppercase tracking-wide ${fuerte ? 'text-white/70' : 'text-slate-400'}`}>
        {etiqueta}
      </p>
      <p className={`mt-0.5 text-[15px] font-bold tabular-nums ${fuerte ? 'text-white' : 'text-brand-dark'}`}>
        {valor}
      </p>
    </div>
  );
}

const th = 'px-2 py-1.5 text-left text-[9px] font-bold uppercase tracking-wide text-slate-400';
const td = 'border-t border-slate-100 px-2 py-[5px] align-top';
const der = 'text-right tabular-nums';

export function CotizacionDetallada({ cotizacion, className = '' }: CotizacionDetalladaProps) {
  const r = resumirCotizacion(cotizacion);
  const cobra = cotizacion.cobrarLogistica;
  const hoy = new Date();
  const vence = new Date(hoy);
  vence.setDate(vence.getDate() + DIAS_VIGENCIA);

  const sedes = r.logistica.sedes;
  const varias = sedes.length > 1;
  const nombresSedes = sedes.map((s, i) => s.destino || (varias ? `Sede ${i + 1}` : 'Por definir'));
  const productos = r.lineas.map((l) => l.producto);
  const cliente = cotizacion.cliente || 'su empresa';

  /** Importe si se cobra; "Incluido" si Leucotec lo absorbe. */
  const importe = (v: number) =>
    cobra ? dinero(v) : <span className="font-semibold text-brand-accent">Incluido</span>;

  return (
    <article
      className={`cotizacion-doc mx-auto max-w-[8.5in] bg-white text-[10px] leading-snug text-slate-700 ${className}`}
    >
      {/* ---------------- Encabezado ---------------- */}
      <header className="flex items-start justify-between gap-6 border-b-[3px] border-brand-primary pb-4">
        <div>
          <img src="/logo-leucotec.png" alt="Grupo Leucotec" className="h-11 w-auto" />
          <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-slate-400">
            Salud preventiva corporativa
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold uppercase tracking-wide text-brand-dark">Cotización</p>
          <p className="text-[10px] text-slate-400">Campaña de vacunación en empresa</p>
          <table className="ml-auto mt-2 text-[10px]">
            <tbody>
              <tr>
                <td className="pr-3 text-left text-slate-400">Folio</td>
                <td className="text-right font-bold text-brand-dark">{cotizacion.folio}</td>
              </tr>
              <tr>
                <td className="pr-3 text-left text-slate-400">Fecha</td>
                <td className="text-right">{fechaLarga(hoy)}</td>
              </tr>
              <tr>
                <td className="pr-3 text-left text-slate-400">Vigente hasta</td>
                <td className="text-right">{fechaLarga(vence)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </header>

      {/* ---------------- Cliente ---------------- */}
      <section className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 px-4 py-3">
        <div>
          <p className="text-[8.5px] uppercase tracking-wide text-slate-400">Preparada para</p>
          <p className="text-sm font-bold text-brand-dark">{cotizacion.cliente || 'Por definir'}</p>
        </div>
        <div>
          <p className="text-[8.5px] uppercase tracking-wide text-slate-400">Plantilla</p>
          <p className="text-sm font-bold text-brand-dark">
            {cotizacion.empleados > 0 ? `${formatNumber(cotizacion.empleados)} colaboradores` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[8.5px] uppercase tracking-wide text-slate-400">
            {plural(sedes.length, 'Sede', 'Sedes')}
          </p>
          <p className="text-sm font-bold text-brand-dark">{nombresSedes.join(' · ') || '—'}</p>
        </div>
      </section>

      {/* ---------------- 1. Resumen ejecutivo ---------------- */}
      <Seccion n={1} titulo="Resumen de la campaña" />
      <div className="grid grid-cols-6 gap-2">
        <Dato etiqueta="Dosis" valor={formatNumber(r.dosisTotales)} />
        <Dato etiqueta={plural(r.lineas.length, 'Vacuna', 'Vacunas')} valor={String(r.lineas.length)} />
        <Dato etiqueta={plural(sedes.length, 'Sede', 'Sedes')} valor={String(sedes.length)} />
        <Dato etiqueta="Jornadas" valor={formatNumber(r.jornadas)} />
        <Dato etiqueta="Turnos enfermería" valor={formatNumber(r.turnos)} />
        <Dato etiqueta="Total" valor={dinero(r.total)} fuerte />
      </div>
      <p className="mt-3 text-[10.5px] leading-relaxed text-slate-600">
        Campaña de vacunación para <strong className="text-brand-dark">{cliente}</strong> con{' '}
        <strong className="text-brand-dark">{formatNumber(r.dosisTotales)} dosis</strong> de{' '}
        {enLista(productos)}, aplicadas en{' '}
        {varias ? `${sedes.length} sedes: ${enLista(nombresSedes)}` : `la sede ${nombresSedes[0] ?? ''}`}. Grupo Leucotec lleva a sus instalaciones al personal de enfermería
        durante {formatNumber(r.jornadas)} {plural(r.jornadas, 'jornada', 'jornadas')}, con todos los
        insumos de aplicación y el manejo certificado de los residuos biológico-infecciosos.
        {varias && ' Cada sede cuenta con su propio equipo, por lo que pueden operar al mismo tiempo.'}
        {!cobra && (
          <>
            {' '}
            <strong className="text-brand-dark">
              El servicio completo va incluido: se paga únicamente el biológico.
            </strong>
          </>
        )}
      </p>

      {/* ---------------- 2. Biológicos ---------------- */}
      <Seccion n={2} titulo="Biológicos" nota="Precio por dosis aplicada" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>#</th>
            <th className={th}>Producto</th>
            <th className={`${th} ${der}`}>Dosis</th>
            <th className={`${th} ${der}`}>Precio unitario</th>
            <th className={`${th} ${der}`}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {r.lineas.map((l, i) => (
            <tr key={`${l.producto}-${i}`}>
              <td className={`${td} w-6 text-slate-400`}>{i + 1}</td>
              <td className={`${td} font-semibold text-brand-dark`}>{l.producto}</td>
              <td className={`${td} ${der}`}>{formatNumber(l.dosis)}</td>
              <td className={`${td} ${der}`}>{dinero(l.precio)}</td>
              <td className={`${td} ${der} font-bold text-brand-dark`}>{dinero(l.importe)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td className="px-2 py-2 font-bold text-brand-dark" colSpan={2}>
              Subtotal biológicos
            </td>
            <td className={`px-2 py-2 font-bold text-brand-dark ${der}`}>{formatNumber(r.dosisTotales)}</td>
            <td />
            <td className={`px-2 py-2 font-bold text-brand-dark ${der}`}>{dinero(r.subtotalBiologicos)}</td>
          </tr>
        </tbody>
      </table>

      {/* ---------------- 3. Servicio de aplicación ---------------- */}
      <Seccion n={3} titulo="Servicio de aplicación en sitio" nota={varias ? 'Desglose por sede' : undefined} />
      {sedes.map((s, i) => (
        <div key={i} className="mb-3 break-inside-avoid">
          {varias && (
            <p className="mb-1 mt-2 text-[10px] font-bold text-brand-dark">
              {nombresSedes[i]}
              <span className="ml-2 font-normal text-slate-400">
                {formatNumber(s.dosis)} dosis · {s.foranea ? 'sede foránea' : 'sede local'}
              </span>
            </p>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Concepto</th>
                <th className={th}>Detalle</th>
                <th className={`${th} ${der}`}>Cantidad</th>
                <th className={`${th} ${der}`}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {s.turnos > 0 && (
                <tr>
                  <td className={`${td} font-semibold text-brand-dark`}>Personal de enfermería</td>
                  <td className={td}>
                    {s.enfermerasPorDia} {plural(s.enfermerasPorDia, 'enfermera', 'enfermeras')} por{' '}
                    {s.diasVacunacion} {plural(s.diasVacunacion, 'jornada', 'jornadas')}
                    {' · '}
                    {s.foranea
                      ? 'desplazamiento a sede foránea'
                      : s.jornadaLarga
                        ? 'jornada de más de 4 horas'
                        : 'jornada de 1 a 4 horas'}
                  </td>
                  <td className={`${td} ${der}`}>
                    {s.turnos} {plural(s.turnos, 'turno', 'turnos')}
                  </td>
                  <td className={`${td} ${der}`}>{importe(s.enfermeras)}</td>
                </tr>
              )}
              {s.dosis > 0 && (
                <tr>
                  <td className={`${td} font-semibold text-brand-dark`}>Aplicación de dosis</td>
                  <td className={td}>Aplicación de cada dosis por personal de enfermería en sitio</td>
                  <td className={`${td} ${der}`}>{formatNumber(s.dosis)} dosis</td>
                  <td className={`${td} ${der}`}>{importe(0)}</td>
                </tr>
              )}
              {s.transporte > 0 && (
                <tr>
                  <td className={`${td} font-semibold text-brand-dark`}>Traslado del equipo</td>
                  <td className={td}>
                    {s.foranea
                      ? 'Viaje del personal y del equipo a la sede foránea, ida y vuelta'
                      : 'Traslado del personal y del equipo a sus instalaciones'}
                  </td>
                  <td className={`${td} ${der}`}>1 servicio</td>
                  <td className={`${td} ${der}`}>{importe(s.transporte)}</td>
                </tr>
              )}
              {s.comidas > 0 && (
                <tr>
                  <td className={`${td} font-semibold text-brand-dark`}>Alimentación del equipo</td>
                  <td className={td}>Alimentos del personal durante las jornadas de vacunación</td>
                  <td className={`${td} ${der}`}>
                    {s.diasVacunacion} {plural(s.diasVacunacion, 'jornada', 'jornadas')}
                  </td>
                  <td className={`${td} ${der}`}>{importe(s.comidas)}</td>
                </tr>
              )}
              {s.pruebaCovid > 0 && (
                <tr>
                  <td className={`${td} font-semibold text-brand-dark`}>Prueba COVID al personal</td>
                  <td className={td}>Tamizaje del equipo antes de ingresar a sus instalaciones</td>
                  <td className={`${td} ${der}`}>1 por sede</td>
                  <td className={`${td} ${der}`}>{importe(s.pruebaCovid)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {/* ---------------- 4. Insumos ---------------- */}
      <Seccion n={4} titulo="Insumos de aplicación" nota={`Calculados para ${formatNumber(r.dosisTotales)} dosis`} />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Insumo</th>
            <th className={th}>Rendimiento</th>
            <th className={`${th} ${der}`}>Cantidad</th>
            <th className={`${th} ${der}`}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {INSUMOS_APLICACION.map((ins) => {
            const cantidad = cantidadInsumo(ins, r.dosisTotales);
            return (
              <tr key={ins.nombre}>
                <td className={`${td} font-semibold text-brand-dark`}>{ins.nombre}</td>
                <td className={td}>
                  {ins.porDosis >= 1
                    ? `${ins.porDosis} ${unidadDe(ins, ins.porDosis)} por dosis`
                    : `1 ${ins.unidad} por cada ${Math.round(1 / ins.porDosis)} dosis`}
                </td>
                <td className={`${td} ${der}`}>
                  {formatNumber(cantidad)} {unidadDe(ins, cantidad)}
                </td>
                <td className={`${td} ${der}`}>{importe(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ---------------- 5. RPBI ---------------- */}
      <Seccion n={5} titulo="Manejo de residuos peligrosos (RPBI)" nota="NOM-087-SEMARNAT-SSA1-2002" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Concepto</th>
            <th className={th}>Detalle</th>
            <th className={`${th} ${der}`}>Cantidad</th>
            <th className={`${th} ${der}`}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {MANEJO_RPBI.map((x) => (
            <tr key={x.nombre}>
              <td className={`${td} font-semibold text-brand-dark`}>{x.nombre}</td>
              <td className={td}>{x.detalle}</td>
              <td className={`${td} ${der}`}>
                {sedes.length} {plural(sedes.length, 'sede', 'sedes')}
              </td>
              <td className={`${td} ${der}`}>{importe(0)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td className="px-2 py-2 font-bold text-brand-dark" colSpan={3}>
              Servicio, insumos y RPBI
            </td>
            <td className={`px-2 py-2 font-bold text-brand-dark ${der}`}>
              {cobra ? dinero(r.logistica.total) : <span className="text-brand-accent">Incluido</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ---------------- Totales ---------------- */}
      <section className="mt-6 flex break-inside-avoid justify-end">
        <table className="w-[55%] border-collapse text-[11px]">
          <tbody>
            <tr>
              <td className="px-3 py-1.5 text-slate-500">Biológicos</td>
              <td className={`px-3 py-1.5 ${der}`}>{dinero(r.subtotalBiologicos)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1.5 text-slate-500">Servicio de aplicación, insumos y RPBI</td>
              <td className={`px-3 py-1.5 ${der}`}>
                {cobra ? dinero(r.logistica.total) : <span className="font-semibold text-brand-accent">Sin costo</span>}
              </td>
            </tr>
            <tr className="bg-brand-dark text-white">
              <td className="px-3 py-2.5 text-[13px] font-bold">Total de la campaña</td>
              <td className={`px-3 py-2.5 text-[13px] font-bold ${der}`}>{dinero(r.total)}</td>
            </tr>
            <tr>
              <td className="px-3 pt-1 text-[9px] text-slate-400" colSpan={2}>
                Precios en pesos mexicanos. No incluyen IVA.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------------- 6. Condiciones ---------------- */}
      <div className="break-inside-avoid">
        <Seccion n={6} titulo="Condiciones" />
        <ul className="ml-4 list-disc space-y-1 text-[9.5px] text-slate-500">
          <li>
            Cotización vigente por {DIAS_VIGENCIA} días naturales. El precio del biológico está sujeto a
            disponibilidad del laboratorio.
          </li>
          {!cobra && (
            <li>
              El personal de enfermería, el traslado, los insumos y el manejo de RPBI van incluidos sin
              costo adicional.
            </li>
          )}
          <li>
            Los residuos peligrosos biológico-infecciosos se manejan conforme a la NOM-087-SEMARNAT-SSA1-2002,
            con recolección por empresa autorizada.
          </li>
          <li>El pago con tarjeta causa un cargo adicional por comisión bancaria.</li>
          <li>Las jornadas se programan de común acuerdo con al menos 5 días hábiles de anticipación.</li>
        </ul>
      </div>

      {/* ---------------- 7. Aceptación ---------------- */}
      <section className="mt-10 grid break-inside-avoid grid-cols-2 gap-12">
        <div>
          <div className="h-12 border-b border-slate-400" />
          <p className="mt-1.5 text-[9.5px] font-bold text-brand-dark">Acepto la cotización</p>
          <p className="text-[9px] text-slate-400">Nombre, cargo y firma · {cotizacion.cliente || 'Cliente'}</p>
        </div>
        <div>
          <div className="h-12 border-b border-slate-400" />
          <p className="mt-1.5 text-[9.5px] font-bold text-brand-dark">Grupo Leucotec</p>
          <p className="text-[9px] text-slate-400">Ejecutivo de cuenta</p>
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-between border-t border-slate-200 pt-3 text-[8.5px] text-slate-400">
        <span>Grupo Leucotec · Salud preventiva corporativa</span>
        <span>Folio {cotizacion.folio}</span>
      </footer>
    </article>
  );
}
