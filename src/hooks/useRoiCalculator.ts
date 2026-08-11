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
 * Catálogo de vacunas que Leucotec aplica en campañas corporativas
 * (presentación de servicios 2026).
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
    costoDosis: 450,
    efectividad: 0.6,
    pctPoblacionRiesgo: 1.0,
    nota: 'Campaña anual estacional. Toda la plantilla; es la de mayor incidencia.',
  },
  {
    nombre: 'Neumococo',
    activa: true,
    tasaContagio: 0.16,
    diasAusencia: 5,
    costoMedicoPorCaso: 6000,
    costoDosis: 1200,
    efectividad: 0.8,
    pctPoblacionRiesgo: 1.0,
    nota: 'Esquema PCV13 / PPSV23. Ojo: con una tasa de 16% se asume enfermedad respiratoria en general, mayormente ambulatoria. Si Leucotec se refiere a neumonía confirmada, la tasa debe bajar y el costo médico subir mucho.',
  },
  {
    nombre: 'Herpes Zóster',
    activa: true,
    tasaContagio: 0.06,
    diasAusencia: 21,
    costoMedicoPorCaso: 22000,
    costoDosis: 4000,
    efectividad: 0.9,
    pctPoblacionRiesgo: 0.2,
    nota: 'Dirigida a mayores de 50 años (~20% de plantilla). Su valor está en la neuralgia postherpética, que incapacita meses. Nota: la protección dura años, pero aquí se carga contra un solo ejercicio.',
  },
  {
    nombre: 'COVID-19',
    activa: false,
    tasaContagio: 0.15,
    diasAusencia: 7,
    costoMedicoPorCaso: 6000,
    costoDosis: 600,
    efectividad: 0.55,
    pctPoblacionRiesgo: 1.0,
    nota: 'Refuerzo anual. Ajusta los días según el protocolo de aislamiento del cliente.',
  },
  {
    nombre: 'Hepatitis A/B',
    activa: false,
    tasaContagio: 0.02,
    diasAusencia: 20,
    costoMedicoPorCaso: 30000,
    costoDosis: 900,
    efectividad: 0.95,
    pctPoblacionRiesgo: 1.0,
    nota: 'Baja incidencia, pero cada caso implica una ausencia muy prolongada.',
  },
  {
    nombre: 'Fiebre Amarilla',
    activa: false,
    tasaContagio: 0.02,
    diasAusencia: 10,
    costoMedicoPorCaso: 45000,
    costoDosis: 1100,
    efectividad: 0.99,
    pctPoblacionRiesgo: 0.03,
    nota: 'Sólo personal que viaja a zonas endémicas (~3%). Suele ser requisito migratorio.',
  },
  {
    nombre: 'VPH',
    activa: false,
    tasaContagio: 0,
    diasAusencia: 0,
    costoMedicoPorCaso: 0,
    costoDosis: 2400,
    efectividad: 0.9,
    pctPoblacionRiesgo: 0.15,
    nota: 'Prevención oncológica a largo plazo: no genera ahorro por ausentismo en el año. Se argumenta como prestación y RSE.',
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
