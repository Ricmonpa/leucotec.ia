// ---------------------------------------------------------------------------
// Pruebas del motor de logística contra el Excel de Martin (V10.4).
//
// Si alguna falla, la web dejó de cuadrar con la hoja que usan los vendedores.
// Aquí sólo viven cifras de LOGÍSTICA y precios de venta: nunca costos de
// compra ni márgenes, que con el precio despejan el costo.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import {
  calcularLogistica,
  descuadreDosis,
  sedeNueva,
  type ParametrosEmpresa,
  type Sede,
} from './calculations';

const conSedes = (sedes: Sede[]) => ({ sedes }) as ParametrosEmpresa;
const sede = (s: Partial<Sede>): Sede => ({ ...sedeNueva(), ...s });

describe('logística', () => {
  it('caso de referencia de Martin: 30 dosis, local 1 a 4, 1 enfermera, $800 de transporte', () => {
    const l = calcularLogistica(
      conSedes([sede({ dosis: 30, jornadaLarga: false, enfermerasPorDia: 1, diasVacunacion: 1, transporte: 800 })]),
      30,
    );
    expect(l.enfermeras).toBe(600);
    expect(l.viaticos).toBe(1135); // transporte + prueba COVID
    expect(l.insumos).toBeCloseTo(542.19, 2);
    expect(l.total).toBeCloseTo(2277.19, 2);
    expect(descuadreDosis(l)).toBeNull();
  });

  it('tarifas de enfermera: local corta 600, local larga 800, foránea 801', () => {
    const tarifa = (s: Partial<Sede>) =>
      calcularLogistica(conSedes([sede({ dosis: 1, enfermerasPorDia: 1, diasVacunacion: 1, ...s })]), 1).sedes[0]
        .tarifaEnfermera;
    expect(tarifa({ jornadaLarga: false })).toBe(600);
    expect(tarifa({ jornadaLarga: true })).toBe(800);
    expect(tarifa({ foranea: true, jornadaLarga: false })).toBe(801);
  });

  it('la prueba COVID se cobra una vez por sede y sólo si hay enfermeras', () => {
    const l = calcularLogistica(
      conSedes([
        sede({ dosis: 10, enfermerasPorDia: 2, diasVacunacion: 3 }),
        sede({ dosis: 10, enfermerasPorDia: 0, diasVacunacion: 3 }),
      ]),
      20,
    );
    expect(l.sedes.map((s) => s.pruebaCovid)).toEqual([335, 0]);
  });

  it('dos sedes: contar 100 + 40 en vez de 60 + 40 cobra 40 dosis de insumos de más', () => {
    const base = { enfermerasPorDia: 1, diasVacunacion: 1, transporte: 500 };
    const bien = calcularLogistica(conSedes([sede({ ...base, dosis: 60 }), sede({ ...base, dosis: 40 })]), 100);
    const doble = calcularLogistica(conSedes([sede({ ...base, dosis: 100 }), sede({ ...base, dosis: 40 })]), 100);
    expect(doble.total - bien.total).toBeCloseTo(722.92, 2);
    expect(descuadreDosis(bien)).toBeNull();
    expect(descuadreDosis(doble)).toBe('sobran');
  });

  it('la primera sede en 0 absorbe las dosis que falten', () => {
    const l = calcularLogistica(conSedes([sede({ dosis: 0 }), sede({ dosis: 40 })]), 100);
    expect(l.sedes.map((s) => s.dosis)).toEqual([60, 40]);
  });
});

describe('descuadreDosis', () => {
  const logistica = (dosis: number[], total: number) =>
    // Las sedes con 0 absorben: para probar "faltan" y "sede sin dosis" se
    // arma el resultado a mano en vez de pasar por el reparto.
    ({
      sedes: dosis.map((d) => ({ dosis: d })),
      dosisTotales: total,
      dosisAsignadas: dosis.reduce((a, b) => a + b, 0),
    }) as Parameters<typeof descuadreDosis>[0];

  it('faltan', () => expect(descuadreDosis(logistica([60, 20], 100))).toBe('faltan'));
  it('sobran', () => expect(descuadreDosis(logistica([60, 60], 100))).toBe('sobran'));
  it('sede activa sin dosis', () => expect(descuadreDosis(logistica([100, 0], 100))).toBe('sede-sin-dosis'));
  it('cuadra', () => expect(descuadreDosis(logistica([60, 40], 100))).toBeNull());
});

describe('una sola sede', () => {
  it('aplica toda la campaña aunque traiga dosis viejas de cuando había dos sedes', () => {
    // El vendedor escribió 200 en la sede 1, la sede 2 absorbía 100 y luego
    // borró la sede 2: esas 100 dosis no pueden desaparecer del costo.
    const base = { enfermerasPorDia: 1, diasVacunacion: 1, transporte: 1200 };
    const dos = calcularLogistica(
      conSedes([sede({ ...base, dosis: 200 }), sede({ ...base, dosis: 0, transporte: 0 })]),
      300,
    );
    const una = calcularLogistica(conSedes([sede({ ...base, dosis: 200 })]), 300);

    expect(una.dosisAsignadas).toBe(300);
    expect(una.insumos).toBeCloseTo(dos.insumos, 2);
    expect(descuadreDosis(una)).toBeNull();
  });
});
