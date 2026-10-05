// ---------------------------------------------------------------------------
// Propuesta de retorno: el ROI de UNA cotización.
//
// Es el anexo que acompaña a la cotización para un prospecto calificado. No
// se captura nada: todo sale de la cotización que ya armó el vendedor, y la
// página es de sólo lectura. Si el ROI se pudiera mover, dejaría de ser la
// conclusión de la propuesta y se volvería un argumento que cualquiera
// acomoda a su favor.
//
// Regla de oro: la INVERSIÓN del ROI es, al peso, el TOTAL de la cotización.
// Por eso cada renglón cotizado entra al cálculo, incluso los productos que
// el modelo no sabe valuar: esos cuentan como inversión y no como ahorro.
// Es la opción conservadora; la contraria inflaría el retorno.
//
// Los supuestos epidemiológicos (contagio, días, costo médico, efectividad)
// son los mismos del simulador y se muestran en la página para que el CFO
// vea de dónde sale cada número.
// ---------------------------------------------------------------------------

import {
  calcularSimulacion,
  type ParametrosEmpresa,
  type ParametrosEnfermedad,
  type ResultadoSimulacion,
} from './calculations';
import { datosDe, enfermedadDeProducto } from './catalogoProductos';
import { resumirCotizacion, type CotizacionImprimible } from './cotizacionImprimible';
import { EMPRESA_INICIAL, ENFERMEDADES_INICIALES } from '../hooks/useRoiCalculator';

export interface PropuestaRoi {
  empresa: ParametrosEmpresa;
  enfermedades: ParametrosEnfermedad[];
  resultado: ResultadoSimulacion;
  /** Total de la cotización. Debe coincidir con resultado.inversionTotal. */
  totalCotizacion: number;
  /** Si el costo por día vino de la cotización o es el de referencia. */
  costoDiaCapturado: boolean;
  /** Productos cotizados que el modelo no sabe valuar. */
  sinModelo: string[];
}

export function propuestaDesdeCotizacion(c: CotizacionImprimible): PropuestaRoi {
  const resumen = resumirCotizacion(c);

  // Varios renglones pueden ser de la misma enfermedad (Havrix y Engerix-B
  // sueltos, dos presentaciones de influenza): se juntan en una sola.
  // Se cuenta por PERSONAS, no por dosis: con esquema completo, 150 dosis de
  // Gardasil protegen a 50 personas, no a 150. Sin esquema son el mismo
  // número. (Cleide y Martin, oct 2026.)
  const grupos = new Map<
    string,
    { productos: string[]; personas: number; importe: number; conocida: boolean }
  >();
  for (const l of resumen.lineas) {
    // Primero por código (enlaces nuevos); los enlaces viejos traen sólo el
    // nombre comercial.
    const enfermedad = datosDe(l.codigo).enfermedad ?? enfermedadDeProducto(l.producto);
    const clave = enfermedad ?? l.producto;
    const g = grupos.get(clave) ?? { productos: [], personas: 0, importe: 0, conocida: !!enfermedad };
    if (!g.productos.includes(l.producto)) g.productos.push(l.producto);
    g.personas += l.personas ?? l.dosis;
    g.importe += l.importe;
    grupos.set(clave, g);
  }

  // La plantilla nunca puede ser menor a las personas de una vacuna: si el
  // vendedor no la capturó, o la capturó corta, el % en riesgo se topa en 100%
  // y la inversión dejaría de cuadrar con la cotización.
  const mayorGrupo = Math.max(0, ...[...grupos.values()].map((g) => g.personas));
  const numEmpleados = Math.max(c.empleados || 0, mayorGrupo, 1);

  const costoDiaCapturado = (c.costoDia ?? 0) > 0;
  const empresa: ParametrosEmpresa = {
    ...EMPRESA_INICIAL,
    empresa: c.cliente || 'Su empresa',
    numEmpleados,
    costoDiaEmpleado: costoDiaCapturado ? (c.costoDia as number) : EMPRESA_INICIAL.costoDiaEmpleado,
    cobrarLogistica: c.cobrarLogistica,
    sedes: c.sedes,
  };

  const sinModelo: string[] = [];
  const enfermedades: ParametrosEnfermedad[] = [...grupos.entries()].map(([clave, g]) => {
    const base = ENFERMEDADES_INICIALES.find((e) => e.nombre === clave);
    // Con pct = personas / plantilla el motor reconstruye a cuánta gente
    // protege, y con costo = importe / personas reconstruye exactamente el
    // importe de la cotización, lleve una dosis o el esquema completo.
    const cotizado = {
      activa: true,
      producto: g.productos.join(' + '),
      costoDosis: g.personas > 0 ? g.importe / g.personas : 0,
      pctPoblacionRiesgo: g.personas / numEmpleados,
    };

    if (g.conocida && base) return { ...base, ...cotizado };

    sinModelo.push(...g.productos);
    return {
      nombre: clave,
      ...cotizado,
      tasaContagio: 0,
      diasAusencia: 0,
      costoMedicoPorCaso: 0,
      aniosProteccion: 1,
      efectividad: 0,
      nota: 'Sin modelo de riesgo: cuenta como inversión, no como ahorro.',
    };
  });

  return {
    empresa,
    enfermedades,
    resultado: calcularSimulacion(empresa, enfermedades),
    totalCotizacion: resumen.total,
    costoDiaCapturado,
    sinModelo,
  };
}
