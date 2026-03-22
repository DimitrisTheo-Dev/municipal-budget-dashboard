import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

function formatCurrency(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-panel-lg">
      <p className="text-xs font-medium text-slate-500">{item.payload.name}</p>
      <p className="mt-0.5 text-base font-bold text-slate-900">{formatCurrency(item.value)}</p>
    </div>
  );
}

export default function BarChartComparison({ municipalityA, municipalityB, totalA, totalB, year }) {
  const chartData = [
    municipalityA ? { name: municipalityA, total: Number(totalA || 0) } : null,
    municipalityB ? { name: municipalityB, total: Number(totalB || 0) } : null
  ].filter(Boolean);
  const isComparison = chartData.length > 1;

  return (
    <section className="card" aria-label="Bar chart comparison">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {isComparison ? 'Συνολικές δαπάνες' : 'Συνολική δαπάνη'}
          </h3>
          <p className="text-xs text-slate-500">Έτος {year}</p>
        </div>
        <span className="badge-blue">Σύνολα</span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }} />
            <Bar
              dataKey="total"
              name="Δαπάνες"
              fill="#3b82f6"
              radius={[10, 10, 0, 0]}
              maxBarSize={80}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
