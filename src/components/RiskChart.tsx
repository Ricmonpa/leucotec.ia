import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, type ResultadoSimulacion } from '../lib/calculations';

interface RiskChartProps {
  resultado: ResultadoSimulacion;
}

const formatAxis = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
};

export function RiskChart({ resultado }: RiskChartProps) {
  const data = resultado.detalle.map((d) => ({
    name: d.nombre,
    'Pérdida por Ausentismo': d.costoAusentismo,
    'Inversión Preventiva': d.inversionVacunas,
    'Ahorro Neto': d.ahorroNeto,
  }));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-brand-dark">
        <BarChart3 className="h-5 w-5 text-brand-secondary" />
        Riesgo Financiero vs. Prevención
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 13 }}
            />
            <YAxis
              tickFormatter={formatAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                borderRadius: '10px',
                border: 'none',
                boxShadow: '0 8px 24px -6px rgb(0 0 0 / 0.15)',
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px' }} />
            <Bar
              dataKey="Pérdida por Ausentismo"
              fill="#FF3860"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="Inversión Preventiva"
              fill="#00A8E8"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
            <Bar dataKey="Ahorro Neto" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d['Ahorro Neto'] >= 0 ? '#00D1B2' : '#FF3860'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
