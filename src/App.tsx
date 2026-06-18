import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { KpiCards } from './components/KpiCards';
import { RiskChart } from './components/RiskChart';
import { PredictiveAlert } from './components/PredictiveAlert';
import { useRoiCalculator } from './hooks/useRoiCalculator';

function App() {
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

        <footer className="no-print mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-4 pb-2">
          <span className="text-xs text-slate-400">Desarrollado por</span>
          <span
            className="inline-flex items-center rounded-lg p-1"
            style={{ background: 'linear-gradient(135deg, #1F2A44 0%, #D6443B 100%)' }}
          >
            <img
              src="/n3-logo.png"
              alt="N3 Thinktech IA Laboratory"
              className="h-6 w-auto"
            />
          </span>
          <span className="text-xs font-medium text-slate-500">Thinktech IA Laboratory</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
