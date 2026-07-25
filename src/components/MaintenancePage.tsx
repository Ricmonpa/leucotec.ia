import { Wrench, CalendarCheck } from 'lucide-react';

export function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">

        <img
          src="/logo-leucotec.png"
          alt="Grupo Leucotec"
          className="mx-auto mb-6 h-12 w-auto"
        />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
          <Wrench className="h-7 w-7 text-brand-primary" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-slate-800">
          Simulador en mantenimiento
        </h1>
        <p className="mb-1 text-sm text-slate-500">
          Estamos realizando mejoras para ofrecerte una mejor experiencia.
        </p>
        <p className="mb-8 text-sm text-slate-500">
          Estaremos de vuelta muy pronto.
        </p>

        <a
          href="mailto:rmmoncada5@gmail.com?subject=Solicitud%20de%20demo%20guiado%20%E2%80%94%20Simulador%20ROI%20Leucotec&body=Hola%2C%20me%20gustar%C3%ADa%20agendar%20un%20demo%20guiado%20del%20simulador."
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
        >
          <CalendarCheck className="h-4 w-4" />
          Solicitar demo guiado
        </a>

        <p className="mt-6 text-[11px] text-slate-300">
          Grupo Leucotec · Analítica Corporativa
        </p>
      </div>
    </div>
  );
}
