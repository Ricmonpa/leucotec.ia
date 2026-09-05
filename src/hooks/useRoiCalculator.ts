import { useMemo, useState } from 'react';
import {
  calcularSimulacion,
  type ParametrosEmpresa,
  type ParametrosEnfermedad,
  type ResultadoSimulacion,
} from '../lib/calculations';

/** Valores iniciales del prospecto (demo). */
const EMPRESA_INICIAL: ParametrosEmpresa = {
  empresa: 'Grupo Bimbo',
  numEmpleados: 400,
  // Sueldo de ~$21,000/mes con carga social: (21000 / 21.7) * 1.35 ≈ 1300.
  // El valor anterior (5600) implicaba sueldos de seis cifras y no era
  // defendible como punto de partida.
  costoDiaEmpleado: 1300,
  aplicarBeneficioFiscal: true,
  pctDeducible: 0.53, // Art. 28 fr. XXX LISR: 53% si se mantienen prestaciones
  tasaISR: 0.3, // ISR corporativo en México
};

/**
 * Catálogo de vacunas que Leucotec aplica en campañas corporativas.
 *
 * Los precios son de VENTA, derivados del cotizador operativo de Leucotec
 * (ago 2026). Aquí no viven sus costos de compra ni sus márgenes: eso es
 * información interna y este bundle es público.
 *
 * Las tres primeras vienen activas por defecto: son el esquema clásico de
 * campaña en empresa. El resto se activa con un clic según el cliente.
 */
const ENFERMEDADES_INICIALES: ParametrosEnfermedad[] = [
  {
    nombre: 'Influenza',
    activa: true,
    tasaContagio: 0.2,
    diasAusencia: 4,
    costoMedicoPorCaso: 2000,
    costoDosis: 440,
    aniosProteccion: 1,
    efectividad: 0.6,
    pctPoblacionRiesgo: 1.0,
    nota: 'Precio de Vaxigrip Tetra. Campaña anual estacional; toda la plantilla y la de mayor incidencia.',
  },
  {
    nombre: 'Neumococo',
    activa: true,
    tasaContagio: 0.16,
    diasAusencia: 5,
    costoMedicoPorCaso: 6000,
    costoDosis: 1800,
    aniosProteccion: 5,
    efectividad: 0.8,
    pctPoblacionRiesgo: 1.0,
    nota: 'Precio de Prevenar 20 (dosis única). Ojo: con una tasa de 16% se asume enfermedad respiratoria en general, mayormente ambulatoria. Si Leucotec se refiere a neumonía confirmada, la tasa debe bajar y el costo médico subir mucho.',
  },
  {
    nombre: 'Herpes Zóster',
    activa: true,
    tasaContagio: 0.06,
    diasAusencia: 21,
    costoMedicoPorCaso: 22000,
    costoDosis: 3500,
    aniosProteccion: 10,
    efectividad: 0.9,
    pctPoblacionRiesgo: 0.2,
    nota: 'Precio de Shingrix. Dirigida a mayores de 50 años (~20% de plantilla). Su valor está en la neuralgia postherpética, que incapacita meses. La dosis protege ~10 años y el modelo la amortiza a ese plazo.',
  },
  {
    nombre: 'COVID-19',
    activa: false,
    tasaContagio: 0.15,
    diasAusencia: 7,
    costoMedicoPorCaso: 6000,
    costoDosis: 1060,
    aniosProteccion: 1,
    efectividad: 0.55,
    pctPoblacionRiesgo: 1.0,
    nota: 'Precio de Comirnaty XBB adulto. Refuerzo anual; ajusta los días según el protocolo de aislamiento del cliente.',
  },
  {
    nombre: 'Hepatitis A/B',
    activa: false,
    tasaContagio: 0.02,
    diasAusencia: 20,
    costoMedicoPorCaso: 30000,
    costoDosis: 1755,
    aniosProteccion: 20,
    efectividad: 0.95,
    pctPoblacionRiesgo: 1.0,
    nota: 'Esquema A+B: Havrix adulto + Engerix-B adulto. Baja incidencia, pero cada caso implica una ausencia muy prolongada.',
  },
  {
    nombre: 'Fiebre Amarilla',
    activa: false,
    tasaContagio: 0.02,
    diasAusencia: 10,
    costoMedicoPorCaso: 45000,
    costoDosis: 3070,
    aniosProteccion: 10,
    efectividad: 0.99,
    pctPoblacionRiesgo: 0.03,
    nota: 'Precio de Stamaril. Sólo personal que viaja a zonas endémicas (~3%). Suele ser requisito migratorio.',
  },
  {
    nombre: 'VPH',
    activa: false,
    tasaContagio: 0,
    diasAusencia: 0,
    costoMedicoPorCaso: 0,
    costoDosis: 3700,
    aniosProteccion: 1,
    efectividad: 0.9,
    pctPoblacionRiesgo: 0.15,
    nota: 'Precio de Gardasil 9. Prevención oncológica a largo plazo: no genera ahorro por ausentismo en el año. Se argumenta como prestación y RSE.',
  },
];

export interface UseRoiCalculator {
  empresa: ParametrosEmpresa;
  enfermedades: ParametrosEnfermedad[];
  resultado: ResultadoSimulacion;
  setEmpresaCampo: <K extends keyof ParametrosEmpresa>(
    campo: K,
    valor: ParametrosEmpresa[K],
  ) => void;
  setEnfermedadCampo: <K extends keyof ParametrosEnfermedad>(
    index: number,
    campo: K,
    valor: ParametrosEnfermedad[K],
  ) => void;
  reset: () => void;
}

/**
 * Hook central: mantiene los parámetros de la empresa y de cada enfermedad,
 * y recalcula la simulación de forma memoizada en cada cambio.
 */
export function useRoiCalculator(): UseRoiCalculator {
  const [empresa, setEmpresa] = useState<ParametrosEmpresa>(EMPRESA_INICIAL);
  const [enfermedades, setEnfermedades] = useState<ParametrosEnfermedad[]>(
    ENFERMEDADES_INICIALES,
  );

  const resultado = useMemo(
    () => calcularSimulacion(empresa, enfermedades),
    [empresa, enfermedades],
  );

  const setEmpresaCampo: UseRoiCalculator['setEmpresaCampo'] = (campo, valor) => {
    setEmpresa((prev) => ({ ...prev, [campo]: valor }));
  };

  const setEnfermedadCampo: UseRoiCalculator['setEnfermedadCampo'] = (
    index,
    campo,
    valor,
  ) => {
    setEnfermedades((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [campo]: valor } : e)),
    );
  };

  const reset = () => {
    setEmpresa(EMPRESA_INICIAL);
    setEnfermedades(ENFERMEDADES_INICIALES);
  };

  return {
    empresa,
    enfermedades,
    resultado,
    setEmpresaCampo,
    setEnfermedadCampo,
    reset,
  };
}
