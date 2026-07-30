import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  esSesionNueva,
  guardarLead,
  notificarAcceso,
  registrarEnSheets,
  type Lead,
} from '../lib/lead';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Acepta formatos: +52 55 1234 5678 · 5512345678 · (55) 1234-5678, etc.
const WHATSAPP_VALIDO = /^[\d\s\(\)\+\-]{7,20}$/;

interface LeadGateProps {
  onRegistro: (lead: Lead) => void;
}

export function LeadGate({ onRegistro }: LeadGateProps) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (nombre.trim().length < 3) {
      setError('Escribe tu nombre completo.');
      return;
    }
    if (!CORREO_VALIDO.test(correo.trim())) {
      setError('Revisa tu correo, parece incompleto.');
      return;
    }
    if (!WHATSAPP_VALIDO.test(whatsapp.trim())) {
      setError('Escribe un número de WhatsApp válido.');
      return;
    }

    const lead: Lead = {
      nombre: nombre.trim(),
      correo: correo.trim(),
      whatsapp: whatsapp.trim(),
    };

    setEnviando(true);
    guardarLead(lead);
    // Consume el marcador de sesión: el aviso de "nuevo" ya cubre esta visita,
    // así un refresh no dispara además un aviso de "regreso".
    esSesionNueva();
    // Enviar en paralelo a Sheets y a ntfy para no bloquear el acceso.
    await Promise.all([
      registrarEnSheets(lead, 'nuevo'),
      notificarAcceso(lead, 'nuevo'),
    ]);
    onRegistro(lead);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">

        <img
          src="/logo-leucotec.png"
          alt="Grupo Leucotec"
          className="mx-auto mb-6 h-11 w-auto"
        />

        <h1 className="mb-2 text-center text-lg font-bold text-slate-800">
          Simulador de ROI en Salud Corporativa
        </h1>
        <p className="mb-6 text-center text-sm leading-snug text-slate-500">
          Calcula cuánto le cuesta a tu empresa el ausentismo por enfermedad.
          Déjanos tus datos y entra sin costo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="lead-nombre"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Nombre
            </label>
            <input
              id="lead-nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError('');
              }}
              autoComplete="name"
              placeholder="Tu nombre y apellido"
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-300 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="lead-correo"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Correo
            </label>
            <input
              id="lead-correo"
              type="email"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                setError('');
              }}
              autoComplete="email"
              placeholder="nombre@empresa.com"
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-300 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="lead-whatsapp"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              WhatsApp
            </label>
            <input
              id="lead-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                setError('');
              }}
              autoComplete="tel"
              placeholder="+52 55 1234 5678"
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-300 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {error && (
            <p className="text-center text-xs text-brand-primary">{error}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-60"
          >
            {enviando ? 'Entrando…' : 'Entrar al simulador'}
            {!enviando && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-snug text-slate-400">
          Usamos tus datos únicamente para dar seguimiento a tu interés en los
          servicios de vacunación corporativa de Grupo Leucotec.
        </p>
      </div>
    </div>
  );
}
