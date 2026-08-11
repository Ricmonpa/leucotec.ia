import { useEffect, useRef, useState } from 'react';

/**
 * Anima un número hasta su valor final.
 *
 * No introduce espera real: el resultado ya está calculado, sólo se revela
 * progresivamente. Así los KPIs "corren" al cambiar un supuesto —se siente
 * un motor trabajando— sin sacrificar la respuesta inmediata frente al CFO.
 */
export function useCountUp(valor: number, duracion = 500): number {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);

  useEffect(() => {
    const desde = actual.current;
    const hasta = valor;

    if (desde === hasta || !Number.isFinite(hasta)) {
      actual.current = hasta;
      setMostrado(hasta);
      return;
    }

    const fijar = () => {
      actual.current = hasta;
      setMostrado(hasta);
    };

    // Respeta a quien pidió menos movimiento en su sistema, y no anima en una
    // pestaña oculta: ahí requestAnimationFrame no corre.
    const sinMovimiento = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (sinMovimiento || document.hidden) {
      fijar();
      return;
    }

    let frame = 0;
    let inicio: number | null = null;

    // Red de seguridad: si requestAnimationFrame se detiene a medio camino
    // (pestaña en segundo plano, navegador que lo estrangula), el valor final
    // se fija igual. Una cifra financiera nunca debe quedarse a medias.
    const red = setTimeout(fijar, duracion + 200);

    const paso = (t: number) => {
      if (inicio === null) inicio = t;
      const avance = Math.min((t - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - avance, 3); // desacelera al final
      const v = desde + (hasta - desde) * suave;

      actual.current = v;
      setMostrado(v);

      if (avance < 1) {
        frame = requestAnimationFrame(paso);
      } else {
        clearTimeout(red);
      }
    };

    frame = requestAnimationFrame(paso);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(red);
    };
  }, [valor, duracion]);

  return mostrado;
}
