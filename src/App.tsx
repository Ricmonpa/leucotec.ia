import { useCallback, useEffect, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import {
  cotizadorConfigurado,
  enviarCotizacion,
  type EstadoMargen,
} from './lib/cotizador';
import { AnalysisSequence } from './components/AnalysisSequence';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { KpiCards } from './components/KpiCards';
import { RiskChart } from './components/RiskChart';
import { PredictiveAlert } from './components/PredictiveAlert';
import { ReferenciaEdades } from './components/ReferenciaEdades';
import { LeadGate } from './components/LeadGate';
import {
  esSesionNueva,
  leerLead,
  notificarAcceso,
  type Lead,
} from './lib/lead';
import { useRoiCalculator } from './hooks/useRoiCalculator';

function App() {
  const [lead, setLead] = useState<Lead | null>(leerLead);

  // Quien ya se registró en este equipo entra directo, pero avisamos una vez
  // por sesión para saber que volvió.
  useEffect(() => {
    const guardado = leerLead();
    if (guardado && esSesionNueva()) {
      notificarAcceso(guardado, 'regreso');
    }
  }, []);

  if (!lead) return <LeadGate onRegistro={setLead} />;

  return <Simulator />;
}

function Simulator() {
  const {
    empresa,
    enfermedades,
    resultado,
    setEmpresaCampo,
    setEnfermedadCampo,
    reset,
    desdeCotizacion,
  } = useRoiCalculator();

  // Sólo en el arranque (o al pedirlo). Las ediciones en vivo no pasan por
  // aquí: la respuesta inmediata frente al CFO es lo que vende la herramienta.
  const [analizando, setAnalizando] = useState(true);
  const terminarAnalisis = useCallback(() => setAnalizando(false), []);

  // Envío al cotizador interno de Leucotec. El semáforo es un punto de color:
  // el cliente lo ve y no le dice nada.
  const [enviando, setEnviando] = useState(false);
  const [estadoMargen, setEstadoMargen] = useState<EstadoMargen | null>(null);

  async function handleEnviarCotizador() {
    setEnviando(true);
    const lead = leerLead();
    const envio = await enviarCotizacion(
      empresa,
      enfermedades,
      resultado,
      lead?.nombre ?? '',
    );
    setEstadoMargen(envio.estado);
    setEnviando(false);
  }

  if (analizando) {
    return (
      <AnalysisSequence
        empresa={empresa}
        enfermedades={enfermedades}
        onListo={terminarAnalisis}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Header
          empresa={empresa.empresa}
          onExport={() => window.print()}
          onReset={reset}
          onReanalizar={() => setAnalizando(true)}
          onEnviarCotizador={
            cotizadorConfigurado() ? handleEnviarCotizador : undefined
          }
          enviandoCotizacion={enviando}
          estadoMargen={estadoMargen}
        />

        {desdeCotizacion && (
          <div className="no-print mb-6 flex items-start gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-emerald-800">
              <strong>Cargado desde el cotizador.</strong> Las vacunas, personas
              y precios vienen de la cotización. Puedes ajustar cualquier dato
              aquí sin afectar la hoja.
            </p>
          </div>
        )}

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <InputPanel
            empresa={empresa}
            enfermedades={enfermedades}
            setEmpresaCampo={setEmpresaCampo}
            setEnfermedadCampo={setEnfermedadCampo}
          />

          <section className="order-1 space-y-6 lg:order-2 lg:col-span-8">
            <KpiCards resultado={resultado} />
            <RiskChart resultado={resultado} />
            <PredictiveAlert empresa={empresa.empresa} resultado={resultado} />
            <ReferenciaEdades />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
