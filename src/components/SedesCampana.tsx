// ---------------------------------------------------------------------------
// Sedes de la campaña.
//
// Su cotizador admite hasta cuatro sedes, y pueden operar AL MISMO TIEMPO:
// cada una lleva su propio equipo de enfermeras. Por eso los días no se suman
// entre sedes —se cuentan por separado— y cada una carga su propio traslado,
// sus comidas y su prueba COVID.
// ---------------------------------------------------------------------------

import { MapPin, Plus, X } from 'lucide-react';
import { Field } from './ui/Field';
import { formatCurrency, type CostoLogistica, type Sede } from '../lib/calculations';
import { MAX_SEDES } from '../hooks/useRoiCalculator';

interface SedesCampanaProps {
  sedes: Sede[];
  logistica: CostoLogistica;
  setSedeCampo: <K extends keyof Sede>(i: number, campo: K, valor: Sede[K]) => void;
  agregarSede: () => void;
  quitarSede: (i: number) => void;
}

export function SedesCampana({
  sedes,
  logistica,
  setSedeCampo,
  agregarSede,
  quitarSede,
}: SedesCampanaProps) {
  const varias = sedes.length > 1;
  // Sólo UNA sede absorbe las dosis que no se repartieron: la primera que se
  // deje en cero. Decirle "déjalo en 0 y toma las que sobren" a las demás
  // sería mentira, porque para entonces ya no sobra ninguna.
  const absorbe = sedes.findIndex((s) => !s.dosis || s.dosis <= 0);

  return (
    <div className="space-y-3">
      {sedes.map((sede, i) => {
        // El costo ya calculado de esta sede, con las dosis que le tocaron.
        const costo = logistica.sedes[i];

        return (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-secondary" />
              <input
                type="text"
                value={sede.destino}
                placeholder={varias ? `Sede ${i + 1}` : 'Destino (CDMX, planta…)'}
                onChange={(e) => setSedeCampo(i, 'destino', e.target.value)}
                className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent p-0 text-sm font-bold text-brand-dark placeholder:font-normal placeholder:text-slate-300 focus:border-brand-primary focus:outline-none"
              />
              {costo && costo.total > 0 && (
                <span className="shrink-0 text-xs font-bold tabular-nums text-slate-400">
                  {formatCurrency(costo.total)}
                </span>
              )}
              {varias && (
                <button
                  type="button"
                  onClick={() => quitarSede(i)}
                  aria-label={`Quitar sede ${i + 1}`}
                  className="shrink-0 rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-brand-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSedeCampo(i, 'foranea', !sede.foranea)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left"
                >
                  <span className="text-xs font-semibold text-slate-600">Sede</span>
                  <span className="text-sm font-bold text-brand-primary">
                    {sede.foranea ? 'Foránea' : 'Local'}
                  </span>
                </button>

                {/* En sede foránea la tarifa es fija ($801): la jornada no la mueve. */}
                {sede.foranea ? (
                  <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Enfermera
                    </span>
                    <span className="text-sm font-bold text-slate-400">$801</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSedeCampo(i, 'jornadaLarga', !sede.jornadaLarga)}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left"
                  >
                    <span className="text-xs font-semibold text-slate-600">Horas</span>
                    <span className="text-sm font-bold text-brand-primary">
                      {sede.jornadaLarga ? 'Más de 4' : '1 a 4'}
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field
                  type="number"
                  label="Jornadas"
                  suffix="días"
                  min={0}
                  value={sede.diasVacunacion}
                  onChange={(v) => setSedeCampo(i, 'diasVacunacion', v)}
                />
                <Field
                  type="number"
                  label="Enfermeras/día"
                  min={0}
                  value={sede.enfermerasPorDia}
                  onChange={(v) => setSedeCampo(i, 'enfermerasPorDia', v)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field
                  type="number"
                  label="Transporte"
                  prefix="$"
                  min={0}
                  value={sede.transporte}
                  onChange={(v) => setSedeCampo(i, 'transporte', v)}
                />
                <Field
                  type="number"
                  label="Comidas"
                  prefix="$"
                  min={0}
                  value={sede.comidas}
                  onChange={(v) => setSedeCampo(i, 'comidas', v)}
                />
              </div>

              {/* Con una sola sede el reparto es obvio y el campo sólo estorba. */}
              {varias && (
                <Field
                  type="number"
                  label="Dosis en esta sede"
                  min={0}
                  hint={
                    i === absorbe
                      ? `Toma las dosis que no asignes a las demás sedes: ${costo?.dosis ?? 0} por ahora.`
                      : `Se aplican ${costo?.dosis ?? 0} aquí.`
                  }
                  value={sede.dosis}
                  onChange={(v) => setSedeCampo(i, 'dosis', v)}
                />
              )}
            </div>
          </div>
        );
      })}

      {sedes.length < MAX_SEDES && (
        <button
          type="button"
          onClick={agregarSede}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-400 transition-colors hover:border-brand-primary hover:text-brand-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar sede
        </button>
      )}

      {/* El reparto tiene que cuadrar con la campaña. Si falta, alguien se
          queda sin vacuna; si sobra, se está cobrando logística de dosis que
          no existen. Las dos descuadran el margen. */}
      {logistica.dosisAsignadas !== logistica.dosisTotales && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700">
          {logistica.dosisAsignadas < logistica.dosisTotales ? (
            <>
              Faltan {logistica.dosisTotales - logistica.dosisAsignadas} dosis
              por asignar. Deja una sede en 0 para que las absorba.
            </>
          ) : (
            <>
              Las sedes suman {logistica.dosisAsignadas} dosis y la campaña son{' '}
              {logistica.dosisTotales}. Sobran{' '}
              {logistica.dosisAsignadas - logistica.dosisTotales}: revisa el
              reparto o el costo se infla.
            </>
          )}
        </p>
      )}
    </div>
  );
}
