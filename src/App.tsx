import { useCallback, useEffect, useState } from 'react';
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
  } = useRoiCalculator();

  // Sólo en el arranque (o al pedirlo). Las ediciones en vivo no pasan por
  // aquí: la respuesta inmediata frente al CFO es lo que vende la herramienta.
  const [analizando, setAnalizando] = useState(true);
  const terminarAnalisis = useCallback(() => setAnalizando(false), []);

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
        />

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
