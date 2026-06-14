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
  costoHora: 700,
  horasJornada: 8,
};

/** Supuestos de partida basados en el Excel real de Leucotec. */
const ENFERMEDADES_INICIALES: ParametrosEnfermedad[] = [
  {
    nombre: 'Neumococo',
    tasaContagio: 0.16,
    diasAusencia: 5,
    costoDosis: 1200,
    efectividad: 0.8,
    pctPoblacionRiesgo: 1.0, // se vacuna a toda la plantilla
  },
  {
    nombre: 'Herpes Zóster',
    tasaContagio: 0.06,
    diasAusencia: 21,
    costoDosis: 4000,
    efectividad: 0.9,
    pctPoblacionRiesgo: 0.2, // dirigida a mayores de 50 (~20%)
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
