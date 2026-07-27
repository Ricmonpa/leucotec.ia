import { useState } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { KpiCards } from './components/KpiCards';
import { RiskChart } from './components/RiskChart';
import { PredictiveAlert } from './components/PredictiveAlert';
import { LoginGate } from './components/LoginGate';
import { useRoiCalculator } from './hooks/useRoiCalculator';

function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('leucotec_auth') === '1'
  );

  function handleAuth() {
    sessionStorage.setItem('leucotec_auth', '1');
    setAuthed(true);
  }

  if (!authed) return <LoginGate onAuth={handleAuth} />;

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Header
          empresa={empresa.empresa}
          onExport={() => window.print()}
          onReset={reset}
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
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
