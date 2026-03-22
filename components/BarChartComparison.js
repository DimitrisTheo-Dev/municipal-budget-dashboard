import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function BarChartComparison({ municipalityA, municipalityB, totalA, totalB, year }) {
  // Recharts updates automatically whenever totals or labels in props change.
  const chartData = [
    {
      name: municipalityA,
      total: Number(totalA || 0)
    },
    {
      name: municipalityB,
      total: Number(totalB || 0)
    }
  ];

  return (
    <section className="card" aria-label="Bar chart comparison">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">Σύνολο δαπανών ανά δήμο / Total annual spendings</h3>
        <p className="text-sm text-slate-600">Έτος {year}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="total" name="Δαπάνες" fill="#156de0" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
