import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#156de0', '#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

function formatCurrency(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function toChartData(categories = []) {
  return categories
    .map((item) => ({
      name: item.name,
      value: Number(item.amount || 0)
    }))
    .filter((item) => item.value > 0)
    .slice(0, 8);
}

function PieCard({ title, data, activeCategory, onCategorySelect }) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">{title}</h4>
      {data.length ? (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={42}
                  label={({ name }) => (name.length > 18 ? `${name.slice(0, 18)}...` : name)}
                  onClick={(entry) => {
                    if (!entry?.name) return;
                    onCategorySelect(activeCategory === entry.name ? '' : entry.name);
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={activeCategory === entry.name ? '#0f172a' : '#fff'}
                      strokeWidth={activeCategory === entry.name ? 3 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.map((entry) => (
              <button
                key={`tag-${entry.name}`}
                type="button"
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  activeCategory === entry.name
                    ? 'bg-brand-100 text-brand-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => onCategorySelect(activeCategory === entry.name ? '' : entry.name)}
              >
                {entry.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Δεν υπάρχουν διαθέσιμες κατηγορίες.</div>
      )}
    </article>
  );
}

export default function PieChartComparison({
  municipalityA,
  municipalityB,
  categoriesA,
  categoriesB,
  activeCategory,
  onCategorySelect
}) {
  // The category chips and slices drive table filtering via onCategorySelect.
  const chartDataA = toChartData(categoriesA);
  const chartDataB = toChartData(categoriesB);

  return (
    <section className="card" aria-label="Pie chart category comparison">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Κατανομή ανά κατηγορία / Category distribution</h3>
          <p className="text-sm text-slate-600">Κλικ σε κατηγορία για φιλτράρισμα του πίνακα.</p>
        </div>
        {activeCategory ? (
          <button type="button" className="btn-secondary" onClick={() => onCategorySelect('')}>
            Καθαρισμός φίλτρου / Clear filter
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PieCard
          title={municipalityA}
          data={chartDataA}
          activeCategory={activeCategory}
          onCategorySelect={onCategorySelect}
        />
        <PieCard
          title={municipalityB}
          data={chartDataB}
          activeCategory={activeCategory}
          onCategorySelect={onCategorySelect}
        />
      </div>
    </section>
  );
}
