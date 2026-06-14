# Simulador de ROI en Salud Corporativa — Leucotec

Herramienta de ventas B2B que cuantifica, en tiempo real, la pérdida económica
por ausentismo (Neumococo, Herpes Zóster) frente a la inversión en vacunación,
mostrando el **Ahorro Operativo Neto** y el **ROI** para una empresa prospecto.

## Stack

- **Vite + React + TypeScript** (SPA estática)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Recharts** para visualización
- **lucide-react** para iconos

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build de producción

```bash
npm run build    # genera ./dist
npm run preview  # sirve el build localmente
```

## Arquitectura

- `src/lib/calculations.ts` — motor financiero puro y tipado.
- `src/hooks/useRoiCalculator.ts` — estado y recálculo memoizado.
- `src/components/` — UI (Header, InputPanel, KpiCards, RiskChart, PredictiveAlert).

## Despliegue

Optimizado para **Vercel** (framework Vite autodetectado, `vercel.json` incluido).
