// ---------------------------------------------------------------------------
// Motor financiero del Simulador de ROI Leucotec
//
// Modelo coherente y defendible ante un CFO:
//   1. Se define una "población en riesgo" (a quién tiene sentido vacunar).
//   2. Los casos esperados surgen de esa población * tasa de contagio.
//   3. Cada caso cuesta por dos vías:
//        a) ausentismo = días de ausencia * costo/día del empleado
//        b) atención médica = consultas, estudios, hospitalización
//      Contar sólo (a) subvalúa sistemáticamente las vacunas caras contra
//      eventos graves: su beneficio no está en los días, está en la factura.
//   4. La inversión = población en riesgo * costo de la dosis. Como varias
//      vacunas protegen varios años (Zóster ~10, Neumococo ~5), la inversión
//      se AMORTIZA: se compara el beneficio de un año contra el costo
//      anualizado de la protección. Es la práctica estándar de economía de
//      la salud (costo por año protegido); cargar todo a un ejercicio
//      castiga injustamente a las vacunas de larga duración.
//   5. El ahorro neto = pérdida evitada (según efectividad) - inversión
//      anualizada neta de efecto fiscal.
//
// Todos los supuestos (efectividad, % población en riesgo) son parámetros
// editables, no constantes ocultas: el vendedor debe poder justificarlos.
// ---------------------------------------------------------------------------

/** Parámetros globales de la empresa prospecto. */
export interface ParametrosEmpresa {
  empresa: string;
  numEmpleados: number;
  /** Costo de un día completo de un empleado (sueldo + carga social). */
  costoDiaEmpleado: number;
  /** Si se incluye el beneficio fiscal en la propuesta. */
  aplicarBeneficioFiscal: boolean;
  /**
   * Fracción del gasto que resulta deducible como previsión social (0-1).
   * Art. 28 fr. XXX LISR: 47% o 53% según se mantengan las prestaciones
   * exentas respecto del ejercicio anterior.
   */
  pctDeducible: number;
  /** Tasa de ISR corporativo (0-1). En México, 30%. */
  tasaISR: number;
}

/** Supuestos epidemiológicos y de costo de una enfermedad concreta. */
export interface ParametrosEnfermedad {
  /** Etiqueta para UI y gráficos, p.ej. "Neumococo". */
  nombre: string;
  /** Si está incluida en la campaña que se cotiza. Las inactivas no suman. */
  activa: boolean;
  /** Justificación del supuesto, para defenderlo ante el CFO. */
  nota?: string;
  /** Tasa de contagio anual dentro de la población en riesgo (0-1). */
  tasaContagio: number;
  /** Días de ausentismo promedio por caso. */
  diasAusencia: number;
  /**
   * Costo médico promedio de un caso: consultas, estudios, medicamentos y la
   * proporción de casos que hospitalizan. Es el costo que el ausentismo por sí
   * solo no ve, y el que sostiene a las vacunas caras contra eventos graves.
   */
  costoMedicoPorCaso: number;
  /** Costo de la dosis (campaña completa) por empleado vacunado. */
  costoDosis: number;
  /**
   * Años que dura la protección de la vacuna. La inversión se amortiza a
   * este plazo para comparar beneficio anual contra costo anual.
   */
  aniosProteccion: number;
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
  /** Costo de los días perdidos. */
  costoAusentismo: number;
  /** Costo de atender médicamente los casos. */
  costoMedico: number;
  /** Pérdida total del año: ausentismo + atención médica. */
  costoTotal: number;
  /** Lo que se factura hoy por la campaña de esta vacuna. */
  inversionVacunas: number;
  /**
   * Costo anual de la protección: inversión neta de efecto fiscal dividida
   * entre los años que protege.
   */
  inversionAnualizada: number;
  /** Pérdida evitada gracias a la vacuna (= costoTotal * efectividad). */
  perdidaEvitada: number;
  /** Ahorro neto anual = pérdida evitada - inversión anualizada. */
  ahorroNeto: number;
}

/** Resultado global de la simulación. */
export interface ResultadoSimulacion {
  detalle: ResultadoEnfermedad[];
  /** Sólo los días perdidos. */
  costoAusentismoTotal: number;
  /** Sólo la atención médica de los casos. */
  costoMedicoTotal: number;
  /** Pérdida total expuesta: ausentismo + atención médica. */
  costoTotalExpuesto: number;
  /** Pérdida evitada por la campaña, antes de restar la inversión. */
  perdidaEvitadaTotal: number;
  /** Inversión bruta en vacunas (lo que se factura). */
  inversionTotal: number;
  /**
   * ISR que la empresa deja de pagar por deducir el gasto como previsión
   * social. Es 0 si el beneficio fiscal no está aplicado.
   */
  ahorroFiscal: number;
  /** Costo real de la campaña después del efecto fiscal. */
  inversionNeta: number;
  /** Costo anual de mantener protegida a la plantilla. */
  inversionAnualizadaTotal: number;
  /** Ahorro neto anual = pérdida evitada - inversión anualizada. */
  ahorroNetoTotal: number;
  /** ROI anual en porcentaje: ahorro neto / inversión anualizada * 100. */
  roiGlobal: number;
}

/** Costo de un día completo de inactividad de un empleado. */
export function costoDia(empresa: ParametrosEmpresa): number {
  return empresa.costoDiaEmpleado;
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
  const costoMedico = casosProyectados * enf.costoMedicoPorCaso;
  const costoTotal = costoAusentismo + costoMedico;
  const inversionVacunas = poblacionRiesgo * enf.costoDosis;

  // La deducción fiscal reduce el costo real del gasto en el año de compra;
  // ese costo neto se reparte entre los años que la vacuna protege.
  const factorFiscal = empresa.aplicarBeneficioFiscal
    ? 1 - empresa.pctDeducible * empresa.tasaISR
    : 1;
  const anios = Math.max(1, enf.aniosProteccion || 1);
  const inversionAnualizada = (inversionVacunas * factorFiscal) / anios;

  const perdidaEvitada = costoTotal * enf.efectividad;
  const ahorroNeto = perdidaEvitada - inversionAnualizada;

  return {
    nombre: enf.nombre,
    poblacionRiesgo,
    casosProyectados,
    diasInactividad,
    costoAusentismo,
    costoMedico,
    costoTotal,
    inversionVacunas,
    inversionAnualizada,
    perdidaEvitada,
    ahorroNeto,
  };
}

/** Calcula la simulación completa para todas las enfermedades. */
export function calcularSimulacion(
  empresa: ParametrosEmpresa,
  enfermedades: ParametrosEnfermedad[],
): ResultadoSimulacion {
  // Sólo las vacunas incluidas en la campaña entran al cálculo.
  const detalle = enfermedades
    .filter((e) => e.activa)
    .map((e) => calcularEnfermedad(empresa, e));

  const costoAusentismoTotal = detalle.reduce((s, d) => s + d.costoAusentismo, 0);
  const costoMedicoTotal = detalle.reduce((s, d) => s + d.costoMedico, 0);
  const costoTotalExpuesto = costoAusentismoTotal + costoMedicoTotal;
  const perdidaEvitadaTotal = detalle.reduce((s, d) => s + d.perdidaEvitada, 0);
  const inversionTotal = detalle.reduce((s, d) => s + d.inversionVacunas, 0);

  // Efecto fiscal: la deducción reduce la BASE gravable, no el impuesto.
  // El flujo que la empresa se ahorra es (gasto deducible) x (tasa de ISR).
  const ahorroFiscal = empresa.aplicarBeneficioFiscal
    ? inversionTotal * empresa.pctDeducible * empresa.tasaISR
    : 0;

  const inversionNeta = inversionTotal - ahorroFiscal;

  // Beneficio anual contra costo anual: la comparación justa cuando la
  // protección de varias vacunas dura más de un ejercicio.
  const inversionAnualizadaTotal = detalle.reduce(
    (s, d) => s + d.inversionAnualizada,
    0,
  );
  const ahorroNetoTotal = perdidaEvitadaTotal - inversionAnualizadaTotal;
  const roiGlobal =
    inversionAnualizadaTotal > 0
      ? (ahorroNetoTotal / inversionAnualizadaTotal) * 100
      : 0;

  return {
    detalle,
    costoAusentismoTotal,
    costoMedicoTotal,
    costoTotalExpuesto,
    perdidaEvitadaTotal,
    inversionTotal,
    ahorroFiscal,
    inversionNeta,
    inversionAnualizadaTotal,
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
