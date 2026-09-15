// ---------------------------------------------------------------------------
// Cotizador en línea para vendedores: /cotizador
//
// La segunda puerta del vendedor. La primera es el Sheet de Martin; las dos
// terminan en la misma cotización impresa (/cotizacion).
//
// Sigue el orden del Excel de Martin —cliente, vacunas, logística— para que
// el equipo, que ya está entrenado en ese formato, lo reconozca sin volver a
// aprender. Lo que el Excel no puede hacer y esto sí: usarse cómodo desde el
// celular, guardar el historial y sacar la cotización formal de un clic.
//
// Los costos de compra NO viven aquí: este sitio es público. El semáforo de
// margen lo calcula el Sheet, que es privado, y sólo regresa OK o REVISAR.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FilePlus2,
  Loader2,
  Plus,
  Printer,
  ShieldCheck,
  Syringe,
  TrendingUp,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { Field } from './ui/Field';
import { SedesCampana } from './SedesCampana';
import { PRODUCTOS_POR_ENFERMEDAD, dosisPorCaja } from '../lib/catalogoProductos';
import { descuadreDosis, formatNumber, sedeNueva, type Sede } from '../lib/calculations';
import {
  codificarCotizacion,
  nuevoFolio,
  resumirCotizacion,
  type CotizacionImprimible,
  type LineaCotizacion,
} from '../lib/cotizacionImprimible';
import { revisarMargenCotizacion, type EstadoMargen } from '../lib/cotizador';
import { MAX_SEDES } from '../hooks/useRoiCalculator';

/** Su Excel cotiza hasta ocho vacunas por campaña. */
const MAX_LINEAS = 8;

const CLAVE_BORRADOR = 'leucotec.cotizador.borrador';

interface Borrador {
  /**
   * El folio viaja con el borrador: si cambiara al recargar, la cotización
   * impresa ya no coincidiría con la que quedó en el historial.
   */
  folio: string;
  vendedor: string;
  cliente: string;
  empleados: number;
  /** Costo de un día sin el empleado. Lo usa la propuesta de retorno. */
  costoDia?: number;
  lineas: LineaCaptura[];
  sedes: Sede[];
}

/**
 * Un renglón tal como lo capturó el vendedor. Si `caja` está prendido,
 * `dosis` son cajas y `precio` es por caja; la cotización siempre sale en
 * dosis (ver `enDosis`).
 */
type LineaCaptura = LineaCotizacion & { caja?: boolean };

/**
 * Convierte la captura a dosis. 2 cajas de 10 a $9,500 salen como 20 dosis a
 * $950: el importe, el costo, los insumos y el semáforo quedan idénticos a
 * haberlo capturado en dosis.
 */
function enDosis(l: LineaCaptura): LineaCotizacion {
  const k = l.caja ? dosisPorCaja(l.producto) : 1;
  return { producto: l.producto, dosis: l.dosis * k, precio: k > 1 ? l.precio / k : l.precio };
}

const lineaVacia = (): LineaCaptura => ({ producto: '', dosis: 0, precio: 0 });

function borradorNuevo(vendedor = ''): Borrador {
  return {
    folio: nuevoFolio(),
    vendedor,
    cliente: '',
    empleados: 0,
    lineas: [lineaVacia()],
    // Arranca como la hoja de Martin: una sede local de 1 a 4 horas.
    sedes: [{ ...sedeNueva(), jornadaLarga: false }],
  };
}

/**
 * Lo que el vendedor lleva capturado sobrevive a una recarga o a que se le
 * cierre el navegador del celular a media visita. Si el almacenamiento no
 * está disponible, simplemente arranca en blanco.
 */
function leerBorrador(): Borrador {
  try {
    const crudo = localStorage.getItem(CLAVE_BORRADOR);
    if (crudo) {
      const b = JSON.parse(crudo) as Borrador;
      if (Array.isArray(b.lineas) && Array.isArray(b.sedes) && b.sedes.length) {
        return { ...b, folio: b.folio || nuevoFolio() };
      }
    }
  } catch {
    /* sin almacenamiento: se arranca en blanco */
  }
  return borradorNuevo();
}

/** Precio de lista por nombre comercial, para no cotizar de memoria. */
const PRECIO_DE_LISTA: Record<string, number> = Object.fromEntries(
  Object.values(PRODUCTOS_POR_ENFERMEDAD)
    .flat()
    .map((p) => [p.nombre, p.precio]),
);

const dinero = (v: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const inputBase =
  'w-full rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-slate-800 ' +
  'transition-all focus:border-brand-primary focus:bg-white focus:outline-none ' +
  'focus:ring-2 focus:ring-brand-primary/30';

function Bloque({
  n,
  icono: Icono,
  titulo,
  children,
  nota,
}: {
  n: number;
  icono: typeof Syringe;
  titulo: string;
  nota?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h2 className="flex shrink-0 items-center gap-2 text-base font-bold text-brand-dark">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
            {n}
          </span>
          <Icono className="h-4 w-4 text-brand-secondary" />
          {titulo}
        </h2>
        {nota && <p className="text-[11px] text-slate-400 sm:max-w-[18rem] sm:text-right">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

export function Cotizador() {
  const [b, setB] = useState<Borrador>(leerBorrador);
  const [estado, setEstado] = useState<EstadoMargen | null>(null);
  const [revisando, setRevisando] = useState(false);

  useEffect(() => {
    document.title = 'Cotizador Leucotec';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    } catch {
      /* sin almacenamiento: no pasa nada, sólo no se recuerda */
    }
  }, [b]);

  /**
   * Cualquier cambio invalida el semáforo. Un "OK" que quedó de un precio
   * anterior es peor que no tener semáforo: le da confianza al vendedor en un
   * precio que ya no es el que va a imprimir.
   */
  const cambiar = (f: (actual: Borrador) => Borrador) => {
    setB(f);
    setEstado(null);
  };

  const { folio } = b;
  const cotizacion: CotizacionImprimible = useMemo(
    () => ({
      folio,
      cliente: b.cliente.trim(),
      empleados: b.empleados,
      lineas: b.lineas.map(enDosis),
      sedes: b.sedes,
      cobrarLogistica: false,
      costoDia: b.costoDia || 0,
    }),
    [b, folio],
  );
  const r = useMemo(() => resumirCotizacion(cotizacion), [cotizacion]);
  const listaParaImprimir = r.lineas.length > 0;
  // Con las dosis por sede descuadradas la logística está mal calculada: el
  // semáforo no se consulta, igual que en la hoja de Martin.
  const descuadre = descuadreDosis(r.logistica);

  const setLinea = <K extends keyof LineaCaptura>(i: number, campo: K, valor: LineaCaptura[K]) =>
    cambiar((x) => ({
      ...x,
      lineas: x.lineas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)),
    }));

  const elegirProducto = (i: number, producto: string) =>
    cambiar((x) => ({
      ...x,
      lineas: x.lineas.map((l, j) =>
        // Al elegir el producto se carga su precio de lista; el vendedor lo
        // puede ajustar, igual que en la hoja de Martin.
        j === i
          ? { ...l, producto, caja: false, precio: PRECIO_DE_LISTA[producto] ?? l.precio }
          : l,
      ),
    }));

  /**
   * Cambia entre dosis y cajas sin cambiar la campaña: 20 dosis a $950 pasan
   * a 2 cajas a $9,500, y de regreso.
   */
  const cambiarUnidad = (i: number, caja: boolean) =>
    cambiar((x) => ({
      ...x,
      lineas: x.lineas.map((l, j) => {
        if (j !== i || !!l.caja === caja) return l;
        const k = dosisPorCaja(l.producto);
        return caja
          ? { ...l, caja, dosis: l.dosis / k, precio: l.precio * k }
          : { ...l, caja, dosis: l.dosis * k, precio: l.precio / k };
      }),
    }));

  const setSedeCampo = <K extends keyof Sede>(i: number, campo: K, valor: Sede[K]) =>
    cambiar((x) => ({
      ...x,
      sedes: x.sedes.map((s, j) => (j === i ? { ...s, [campo]: valor } : s)),
    }));

  async function revisar() {
    setRevisando(true);
    const envio = await revisarMargenCotizacion(cotizacion, b.vendedor.trim());
    setEstado(envio.estado);
    setRevisando(false);
  }

  function imprimir() {
    window.open(`/cotizacion?c=${codificarCotizacion(cotizacion)}`, '_blank', 'noopener');
  }

  function verRetorno() {
    window.open(`/propuesta?c=${codificarCotizacion(cotizacion)}`, '_blank', 'noopener');
  }

  function nueva() {
    if (!window.confirm('¿Empezar una cotización nueva? Se borra lo que llevas capturado.')) return;
    setB(borradorNuevo(b.vendedor));
    setEstado(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* ---------------- Barra superior ---------------- */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-leucotec.png" alt="Grupo Leucotec" className="h-7 w-auto sm:h-9" />
            <div className="hidden border-l border-slate-200 pl-3 sm:block">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-dark">Cotizador</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Uso interno · ventas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 md:inline">Folio {folio}</span>
            <button
              type="button"
              onClick={nueva}
              title="Cotización nueva"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-primary"
            >
              <FilePlus2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={imprimir}
              disabled={!listaParaImprimir}
              className="flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir cotización</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* ---------------- 1. Cliente ---------------- */}
          <Bloque n={1} icono={UserRound} titulo="Cliente">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Empresa
                </label>
                <input
                  type="text"
                  value={b.cliente}
                  placeholder="Nombre del cliente"
                  onChange={(e) => cambiar((x) => ({ ...x, cliente: e.target.value }))}
                  className={inputBase}
                />
              </div>
              <Field
                verde
                type="number"
                label="Plantilla"
                min={0}
                value={b.empleados}
                onChange={(v) => cambiar((x) => ({ ...x, empleados: v }))}
              />
              <div className="sm:col-span-3">
                <Field
                  verde
                  type="number"
                  label="Costo de un día de ausencia"
                  prefix="$"
                  min={0}
                  value={b.costoDia ?? 0}
                  hint="Sueldo diario con carga social. Sólo lo usa la propuesta de retorno; si lo dejas en 0 se usa una referencia de $1,300."
                  onChange={(v) => cambiar((x) => ({ ...x, costoDia: v }))}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={b.vendedor}
                  placeholder="Queda en el historial de cotizaciones"
                  onChange={(e) => setB((x) => ({ ...x, vendedor: e.target.value }))}
                  className={inputBase}
                />
              </div>
            </div>
          </Bloque>

          {/* ---------------- 2. Vacunas ---------------- */}
          <Bloque
            n={2}
            icono={Syringe}
            titulo="Vacunas"
            nota="El precio se carga de la lista al elegir el producto. Ajústalo si negociaste otro."
          >
            <div className="space-y-3">
              {b.lineas.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Vacuna {i + 1}
                    </label>
                    <select
                      value={l.producto}
                      onChange={(e) => elegirProducto(i, e.target.value)}
                      className={inputBase}
                    >
                      <option value="">Elige el producto…</option>
                      {Object.entries(PRODUCTOS_POR_ENFERMEDAD).map(([enfermedad, productos]) => (
                        <optgroup key={enfermedad} label={enfermedad}>
                          {productos.map((p) => (
                            <option key={p.nombre} value={p.nombre}>
                              {p.nombre}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {dosisPorCaja(l.producto) > 1 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                        <span className="mr-1 text-slate-400">Capturar en:</span>
                        {[
                          [false, 'Dosis'],
                          [true, `Cajas de ${dosisPorCaja(l.producto)}`],
                        ].map(([enCaja, texto]) => (
                          <button
                            key={String(enCaja)}
                            type="button"
                            onClick={() => cambiarUnidad(i, enCaja as boolean)}
                            className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors ${
                              !!l.caja === enCaja
                                ? 'bg-brand-dark text-white'
                                : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-brand-dark'
                            }`}
                          >
                            {texto as string}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Field
                    verde
                    type="number"
                    label={l.caja ? 'Cajas' : 'Dosis'}
                    min={0}
                    value={l.dosis}
                    onChange={(v) => setLinea(i, 'dosis', v)}
                    hint={
                      l.caja && l.dosis > 0
                        ? `= ${formatNumber(enDosis(l).dosis)} dosis a ${dinero(enDosis(l).precio)}`
                        : undefined
                    }
                    className="col-span-5 sm:col-span-2"
                  />
                  <Field
                    verde
                    type="number"
                    label={l.caja ? 'Precio por caja' : 'Precio unitario'}
                    prefix="$"
                    min={0}
                    value={l.precio}
                    onChange={(v) => setLinea(i, 'precio', v)}
                    className="col-span-7 sm:col-span-3"
                  />
                  <div className="col-span-12 flex items-center justify-end gap-1 sm:col-span-2 sm:pb-2.5">
                    <span className="text-right text-sm font-bold tabular-nums text-brand-dark">
                      {l.dosis * l.precio > 0 ? dinero(l.dosis * l.precio) : '—'}
                    </span>
                    {b.lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          cambiar((x) => ({ ...x, lineas: x.lineas.filter((_, j) => j !== i) }))
                        }
                        aria-label={`Quitar vacuna ${i + 1}`}
                        className="shrink-0 rounded p-1 text-slate-300 hover:bg-white hover:text-brand-primary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {b.lineas.length < MAX_LINEAS && (
              <button
                type="button"
                onClick={() => cambiar((x) => ({ ...x, lineas: [...x.lineas, lineaVacia()] }))}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:border-brand-primary hover:text-brand-primary"
              >
                <Plus className="h-4 w-4" />
                Agregar vacuna
              </button>
            )}
          </Bloque>

          {/* ---------------- 3. Logística ---------------- */}
          <Bloque
            n={3}
            icono={Truck}
            titulo="Logística de la campaña"
            nota="Hasta cuatro sedes. Pueden operar al mismo tiempo: cada una lleva su propio equipo."
          >
            <SedesCampana
              verde
              sedes={b.sedes}
              logistica={r.logistica}
              setSedeCampo={setSedeCampo}
              agregarSede={() =>
                cambiar((x) =>
                  x.sedes.length >= MAX_SEDES ? x : { ...x, sedes: [...x.sedes, sedeNueva()] },
                )
              }
              quitarSede={(i) =>
                cambiar((x) =>
                  x.sedes.length <= 1 ? x : { ...x, sedes: x.sedes.filter((_, j) => j !== i) },
                )
              }
            />
          </Bloque>
        </div>

        {/* ---------------- Resumen ---------------- */}
        <aside className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-2xl bg-brand-dark text-white shadow-xl">
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-widest text-white/60">Precio total de la campaña</p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums">{dinero(r.total)}</p>
                <p className="mt-1 text-xs text-white/60">
                  {cotizacion.cliente || 'Sin cliente'} · {formatNumber(r.dosisTotales)} dosis
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-px bg-white/10 text-sm">
                {[
                  ['Vacunas', String(r.lineas.length)],
                  ['Sedes', String(r.logistica.sedes.length)],
                  ['Jornadas', formatNumber(r.jornadas)],
                  ['Turnos enfermería', formatNumber(r.turnos)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-brand-dark px-5 py-3">
                    <dt className="text-[10px] uppercase tracking-wide text-white/50">{k}</dt>
                    <dd className="font-bold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-white/10 px-5 py-3 text-xs text-white/70">
                Logística calculada:{' '}
                <strong className="text-white">{dinero(r.logistica.total)}</strong>
                <span className="block text-[10px] text-white/50">
                  Enfermeras, traslado, insumos y RPBI. No va como cargo aparte: tu precio por dosis tiene que cubrirla.
                </span>
              </div>
            </section>

            {/* Semáforo de margen: lo decide el Sheet, que es privado. */}
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                <ShieldCheck className="h-4 w-4 text-brand-secondary" />
                Margen
              </p>
              <div className="mt-3">
                {(descuadre || estado === 'REVISAR_DOSIS') && (
                  <div className="rounded-lg bg-red-50 px-3 py-2.5 text-brand-primary">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <AlertTriangle className="h-5 w-5" /> revisar dosis por sede
                    </p>
                    <p className="mt-1 text-[11px] leading-snug">
                      {descuadre === 'sede-sin-dosis'
                        ? 'Hay una sede sin dosis. Asígnale dosis o quítala.'
                        : 'Las dosis de las sedes no suman el total de la campaña.'}{' '}
                      Mientras no cuadren, el margen no se puede revisar.
                    </p>
                  </div>
                )}
                {!descuadre && estado === 'OK' && (
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> ok · el precio aguanta
                  </p>
                )}
                {!descuadre && estado === 'REVISAR' && (
                  <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-bold text-brand-primary">
                    <AlertTriangle className="h-5 w-5" /> revisar precios
                  </p>
                )}
                {!descuadre && estado === 'SIN_CONEXION' && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                    No se pudo consultar el cotizador de Leucotec. Revisa tu conexión e intenta otra vez.
                  </p>
                )}
                {!descuadre && estado === null && (
                  <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    <CircleDashed className="h-4 w-4" /> Sin revisar con los precios actuales
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={revisar}
                disabled={!listaParaImprimir || revisando || !!descuadre}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-dark py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {revisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {revisando ? 'Revisando…' : 'Revisar margen y guardar'}
              </button>
              <p className="mt-2 text-[11px] leading-snug text-slate-400">
                Se compara contra el margen mínimo de Leucotec y queda guardada en el historial con el folio{' '}
                {folio}. Los costos nunca se muestran aquí.
              </p>
            </section>

            <button
              type="button"
              onClick={imprimir}
              disabled={!listaParaImprimir}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <Printer className="h-5 w-5" />
              Imprimir cotización
            </button>
            <button
              type="button"
              onClick={verRetorno}
              disabled={!listaParaImprimir}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-dark bg-white py-3.5 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TrendingUp className="h-5 w-5" />
              Ver retorno de la inversión
            </button>
            {!listaParaImprimir && (
              <p className="text-center text-xs text-slate-400">Elige al menos una vacuna con dosis.</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
