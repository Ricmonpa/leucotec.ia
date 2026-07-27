import { useState, type FormEvent } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const USER = 'leucotec';
const PASS = 'demo2025';
const NTFY_TOPIC = 'leucotec-roi-n3lab-demo';

async function notifyAccess() {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: 'Demo Leucotec abierto',
        Priority: 'default',
        Tags: 'eyes',
      },
      body: `Alguien accedió al simulador ROI — ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`,
    });
  } catch (_) {}
}

interface Props {
  onAuth: () => void;
}

export function LoginGate({ onAuth }: Props) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (user.trim() === USER && pass === PASS) {
      setLoading(true);
      await notifyAccess();
      onAuth();
    } else {
      setError(true);
      setPass('');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">

        <img
          src="/logo-leucotec.png"
          alt="Grupo Leucotec"
          className="mx-auto mb-6 h-11 w-auto"
        />

        <h1 className="mb-1 text-center text-lg font-bold text-slate-800">
          Analítica Corporativa
        </h1>
        <p className="mb-6 text-center text-xs text-slate-400">
          Simulador de Riesgo Financiero
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Usuario
            </label>
            <input
              type="text"
              value={user}
              onChange={e => { setUser(e.target.value); setError(false); }}
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={e => { setPass(e.target.value); setError(false); }}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-center text-xs text-brand-primary">
              Usuario o contraseña incorrectos.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Entrando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-300">
          Grupo Leucotec · Acceso restringido
        </p>
      </div>
    </div>
  );
}
