import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'];

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

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-panel-lg">
      <p className="text-xs font-medium text-slate-500">{item.name}</p>
      <p className="mt-0.5 text-base font-bold text-slate-900">{formatCurrency(item.value)}</p>
    </div>
  );
}

function PieCard({ title, data, activeCategory, onCategorySelect }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">{title}</h4>
      {data.length ? (
        <>
          <div className="mx-auto h-56 w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  onClick={(entry) => {
                    if (!entry?.name) return;
                    onCategorySelect(activeCategory === entry.name ? '' : entry.name);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={activeCategory === entry.name ? '#1e293b' : 'white'}
                      strokeWidth={activeCategory === entry.name ? 2.5 : 1.5}
                      opacity={activeCategory && activeCategory !== entry.name ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.map((entry, index) => (
              <button
                key={`tag-${entry.name}`}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium transition-colors ${
                  activeCategory === entry.name
                    ? 'bg-brand-100 text-brand-800 ring-1 ring-brand-300'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => onCategorySelect(activeCategory === entry.name ? '' : entry.name)}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                {entry.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center rounded-xl bg-slate-100 p-8 text-sm text-slate-500">
          Δεν υπάρχουν κατηγορίες.
        </div>
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
  const chartDataA = toChartData(categoriesA);
  const chartDataB = toChartData(categoriesB);
  const pieCards = [
    municipalityA
      ? {
          title: municipalityA,
          data: chartDataA
        }
      : null,
    municipalityB
      ? {
          title: municipalityB,
          data: chartDataB
        }
      : null
  ].filter(Boolean);

  return (
    <section className="card" aria-label="Pie chart category comparison">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Κατανομή κατηγοριών</h3>
          <p className="text-xs text-slate-500">Κλικ σε κατηγορία για φιλτράρισμα</p>
        </div>
        {activeCategory ? (
          <button type="button" className="btn-ghost text-xs" onClick={() => onCategorySelect('')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
            Καθαρισμός φίλτρου
          </button>
        ) : null}
      </div>

      <div className={`grid gap-4 ${pieCards.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {pieCards.map((card) => (
          <PieCard
            key={card.title}
            title={card.title}
            data={card.data}
            activeCategory={activeCategory}
            onCategorySelect={onCategorySelect}
          />
        ))}
      </div>
    </section>
  );
}
