// ---------------------------------------------------------------------------
// Entrada al cotizador en línea: correo de Leucotec + código por correo.
//
// Leucotec usa correo de Microsoft, así que "Entrar con Google" no le serviría
// a la mayoría del equipo. El código por correo funciona con cualquier
// proveedor y comprueba que el correo sea de verdad de quien entra.
// ---------------------------------------------------------------------------

import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import { pedirCodigo, verificarCodigo, type Sesion } from '../lib/sesion';

const input =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-800 transition-all ' +
  'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30';

export function EntradaCotizador({ onEntrar }: { onEntrar: (s: Sesion) => void }) {
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviarCorreo(e: FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const fallo = await pedirCodigo(correo);
    setCargando(false);
    if (fallo) setError(fallo);
    else setPaso('codigo');
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const r = await verificarCodigo(correo, codigo);
    setCargando(false);
    if (typeof r === 'string') setError(r);
    else onEntrar(r);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <img src="/logo-leucotec.png" alt="Grupo Leucotec" className="h-9 w-auto" />
        <h1 className="mt-6 text-lg font-bold text-brand-dark">Cotizador · uso interno</h1>

        {paso === 'correo' ? (
          <form onSubmit={enviarCorreo} className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              Escribe tu correo de Leucotec. Te enviaremos un código para entrar.
            </p>
            <input
              type="email"
              required
              autoFocus
              value={correo}
              placeholder="tu.nombre@leucotec.mx"
              onChange={(e) => setCorreo(e.target.value)}
              className={input}
            />
            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviarme el código
            </button>
          </form>
        ) : (
          <form onSubmit={enviarCodigo} className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              Te enviamos un código de 6 dígitos a <strong className="text-slate-700">{correo}</strong>.
              Revisa también tu carpeta de correo no deseado.
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={6}
              value={codigo}
              placeholder="000000"
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              className={`${input} text-center text-2xl tracking-[0.4em]`}
            />
            <button
              type="submit"
              disabled={cargando || codigo.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setPaso('correo');
                setCodigo('');
                setError(null);
              }}
              className="w-full text-xs text-slate-400 hover:text-brand-primary"
            >
              Usar otro correo o pedir un código nuevo
            </button>
          </form>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-brand-primary">{error}</p>}
      </div>
    </div>
  );
}
