// ---------------------------------------------------------------------------
// Motor financiero del Simulador de ROI Leucotec
//
// Modelo coherente y defendible ante un CFO:
//   1. Se define una "población en riesgo" (a quién tiene sentido vacunar).
//   2. Los casos esperados surgen de esa población * tasa de contagio.
//   3. La pérdida = casos * días de ausencia * costo/día de un empleado.
//   4. La inversión = población en riesgo * costo de la dosis.
//   5. El ahorro neto = pérdida evitada (según efectividad) - inversión.
//
// Todos los supuestos (efectividad, % población en riesgo) son parámetros
// editables, no constantes ocultas: el vendedor debe poder justificarlos.
// ---------------------------------------------------------------------------

/** Parámetros globales de la empresa prospecto. */
export interface ParametrosEmpresa {
  empresa: string;
  numEmpleados: number;
  costoHora: number;
  horasJornada: number;
}

/** Supuestos epidemiológicos y de costo de una enfermedad concreta. */
export interface ParametrosEnfermedad {
  /** Etiqueta para UI y gráficos, p.ej. "Neumococo". */
  nombre: string;
  /** Tasa de contagio anual dentro de la población en riesgo (0-1). */
  tasaContagio: number;
  /** Días de ausentismo promedio por caso. */
  diasAusencia: number;
  /** Costo de la dosis (campaña completa) por empleado vacunado. */
  costoDosis: number;
  /** Efectividad de la vacuna para evitar el ausentismo (0-1). */
  efectividad: number;
  /** Fracción de la plantilla que es población objetivo/en riesgo (0-1). */
  pctPoblacionRiesgo: number;
}

/** Resultado del cálculo para una enfermedad. */
export interface ResultadoEnfermedad {
  nombre: string;
  poblacionRiesgo: number;
  casosProyectados: number;
  diasInactividad: number;
  costoAusentismo: number;
  inversionVacunas: number;
  /** Pérdida evitada gracias a la vacuna (= costoAusentismo * efectividad). */
  perdidaEvitada: number;
  /** Ahorro neto = pérdida evitada - inversión. */
  ahorroNeto: number;
}

/** Resultado global de la simulación. */
export interface ResultadoSimulacion {
  detalle: ResultadoEnfermedad[];
  costoAusentismoTotal: number;
  inversionTotal: number;
  ahorroNetoTotal: number;
  /** ROI global en porcentaje: ahorro neto / inversión * 100. */
  roiGlobal: number;
}

/** Costo de un día completo de inactividad de un empleado. */
export function costoDia(empresa: ParametrosEmpresa): number {
  return empresa.costoHora * empresa.horasJornada;
}

/** Calcula el resultado para una sola enfermedad. */
export function calcularEnfermedad(
  empresa: ParametrosEmpresa,
  enf: ParametrosEnfermedad,
): ResultadoEnfermedad {
  const cd = costoDia(empresa);
  const poblacionRiesgo = Math.round(empresa.numEmpleados * enf.pctPoblacionRiesgo);
  const casosProyectados = Math.round(poblacionRiesgo * enf.tasaContagio);
  const diasInactividad = casosProyectados * enf.diasAusencia;
  const costoAusentismo = diasInactividad * cd;
  const inversionVacunas = poblacionRiesgo * enf.costoDosis;
  const perdidaEvitada = costoAusentismo * enf.efectividad;
  const ahorroNeto = perdidaEvitada - inversionVacunas;

  return {
    nombre: enf.nombre,
    poblacionRiesgo,
    casosProyectados,
    diasInactividad,
    costoAusentismo,
    inversionVacunas,
    perdidaEvitada,
    ahorroNeto,
  };
}

/** Calcula la simulación completa para todas las enfermedades. */
export function calcularSimulacion(
  empresa: ParametrosEmpresa,
  enfermedades: ParametrosEnfermedad[],
): ResultadoSimulacion {
  const detalle = enfermedades.map((e) => calcularEnfermedad(empresa, e));

  const costoAusentismoTotal = detalle.reduce((s, d) => s + d.costoAusentismo, 0);
  const inversionTotal = detalle.reduce((s, d) => s + d.inversionVacunas, 0);
  const ahorroNetoTotal = detalle.reduce((s, d) => s + d.ahorroNeto, 0);
  const roiGlobal =
    inversionTotal > 0 ? (ahorroNetoTotal / inversionTotal) * 100 : 0;

  return {
    detalle,
    costoAusentismoTotal,
    inversionTotal,
    ahorroNetoTotal,
    roiGlobal,
  };
}

/** Formatea un número como moneda MXN. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Formatea un entero con separador de miles. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value);
}
