import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import BarChartComparison from '../components/BarChartComparison';
import PieChartComparison from '../components/PieChartComparison';
import BudgetTableComparison from '../components/BudgetTableComparison';

function formatCurrency(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function asString(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function StateBanner({ type, title, message, actionLabel, onAction }) {
  const theme = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900'
  }[type || 'info'];

  return (
    <div className={`rounded-xl border px-4 py-3 ${theme}`} role={type === 'error' ? 'alert' : 'status'}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      {actionLabel ? (
        <button type="button" className="btn-secondary mt-3" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, total, count, source, isHigher }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            source === 'mock' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {source === 'mock' ? 'Mock data' : 'Live data'}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
      <p className="mt-1 text-xs text-slate-500">{count} εγγραφές</p>
      {isHigher ? <p className="mt-2 text-xs font-medium text-rose-700">Υψηλότερες δαπάνες</p> : null}
    </article>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const abortRef = useRef(null);

  const municipalityA = asString(router.query.m1).trim();
  const municipalityB = asString(router.query.m2).trim();
  const year = asString(router.query.year).trim();

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!municipalityA || !municipalityB || !year) {
      setError('Λείπουν στοιχεία σύγκρισης. Επιστρέψτε στην αρχική σελίδα.');
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    async function runComparison() {
      setStatus('loading');
      setError('');
      setActiveCategory('');
      setStageMessage('Αναζήτηση οργανισμών...');

      try {
        // Step 1: Resolve municipality text input to organization UIDs.
        const [orgAResponse, orgBResponse] = await Promise.all([
          fetch(`/api/searchOrgs?term=${encodeURIComponent(municipalityA)}`, {
            signal: controller.signal
          }),
          fetch(`/api/searchOrgs?term=${encodeURIComponent(municipalityB)}`, {
            signal: controller.signal
          })
        ]);

        const [orgAData, orgBData] = await Promise.all([orgAResponse.json(), orgBResponse.json()]);

        if (!orgAResponse.ok || !orgAData.selected) {
          throw new Error(`Δεν βρέθηκε οργανισμός για: ${municipalityA}`);
        }

        if (!orgBResponse.ok || !orgBData.selected) {
          throw new Error(`Δεν βρέθηκε οργανισμός για: ${municipalityB}`);
        }

        setStageMessage('Λήψη δαπανών...');

        // Step 2: Fetch budgets for each selected UID and year.
        const [budgetAResponse, budgetBResponse] = await Promise.all([
          fetch(
            `/api/budget?uid=${encodeURIComponent(orgAData.selected.uid)}&year=${encodeURIComponent(
              year
            )}&orgTitle=${encodeURIComponent(orgAData.selected.title)}`,
            { signal: controller.signal }
          ),
          fetch(
            `/api/budget?uid=${encodeURIComponent(orgBData.selected.uid)}&year=${encodeURIComponent(
              year
            )}&orgTitle=${encodeURIComponent(orgBData.selected.title)}`,
            { signal: controller.signal }
          )
        ]);

        const [budgetAData, budgetBData] = await Promise.all([
          budgetAResponse.json(),
          budgetBResponse.json()
        ]);

        if (!budgetAResponse.ok) {
          throw new Error(budgetAData.error || `Αποτυχία φόρτωσης για ${orgAData.selected.title}`);
        }

        if (!budgetBResponse.ok) {
          throw new Error(budgetBData.error || `Αποτυχία φόρτωσης για ${orgBData.selected.title}`);
        }

        setResultA({
          query: municipalityA,
          org: orgAData.selected,
          budget: budgetAData
        });

        setResultB({
          query: municipalityB,
          org: orgBData.selected,
          budget: budgetBData
        });

        setLastUpdated(new Date().toISOString());
        setStatus('done');
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          setError('Η σύγκριση ακυρώθηκε.');
          setStatus('idle');
          return;
        }

        setError(fetchError.message || 'Παρουσιάστηκε σφάλμα κατά τη σύγκριση.');
        setStatus('error');
      }
    }

    runComparison();

    return () => {
      controller.abort();
    };
  }, [router.isReady, municipalityA, municipalityB, year, retryKey]);

  const insight = useMemo(() => {
    if (!resultA || !resultB) {
      return null;
    }

    const totalA = resultA.budget.summary.total;
    const totalB = resultB.budget.summary.total;

    if (totalA === totalB) {
      return `Οι δύο δήμοι έχουν ίσες συνολικές δαπάνες για το ${year}.`;
    }

    const higher = totalA > totalB ? resultA.org.title : resultB.org.title;
    const lowerTotal = Math.min(totalA, totalB) || 1;
    const diffPercent = (((Math.max(totalA, totalB) - lowerTotal) / lowerTotal) * 100).toFixed(1);

    return `${higher} δαπάνησε ${diffPercent}% περισσότερο για το ${year}.`;
  }, [resultA, resultB, year]);

  const hasMockData = Boolean(
    resultA?.budget?.source === 'mock' || resultB?.budget?.source === 'mock'
  );

  return (
    <>
      <Head>
        <title>Comparison | Municipal Budget Dashboard</title>
      </Head>

      <main className="mx-auto min-h-screen w-full max-w-7xl space-y-4 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Municipal Budget Dashboard</h1>
            <p className="text-sm text-slate-600">
              Σύγκριση: {municipalityA} vs {municipalityB} ({year})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(status === 'loading' || status === 'idle') && abortRef.current ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  abortRef.current?.abort();
                }}
              >
                Ακύρωση / Cancel
              </button>
            ) : null}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              Επανάληψη / Retry
            </button>
            <Link href="/" className="btn-secondary">
              Νέα σύγκριση / Back
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Data source: Diavgeia Open Data API | Last updated:{' '}
          {lastUpdated ? new Date(lastUpdated).toLocaleString('el-GR') : '-'}
        </div>

        {status === 'loading' ? (
          <StateBanner
            type="info"
            title="Φόρτωση δεδομένων"
            message={`${stageMessage} Παρακαλώ περιμένετε...`}
          />
        ) : null}

        {status === 'error' ? (
          <StateBanner
            type="error"
            title="Σφάλμα φόρτωσης"
            message={`${error} Δοκίμασε ξανά ή άλλαξε ονόματα δήμων.`}
            actionLabel="Retry"
            onAction={() => setRetryKey((value) => value + 1)}
          />
        ) : null}

        {status === 'done' && hasMockData ? (
          <StateBanner
            type="warning"
            title="Μερικά δεδομένα είναι mock"
            message="Το Diavgeia API ήταν αργό/μη διαθέσιμο και χρησιμοποιήθηκαν ενδεικτικά δεδομένα για να συνεχιστεί η σύγκριση."
          />
        ) : null}

        {status === 'done' && resultA && resultB ? (
          <>
            <section className="grid gap-4 md:grid-cols-2">
              <SummaryCard
                label={resultA.org.title}
                total={resultA.budget.summary.total}
                count={resultA.budget.summary.recordCount}
                source={resultA.budget.source}
                isHigher={resultA.budget.summary.total > resultB.budget.summary.total}
              />
              <SummaryCard
                label={resultB.org.title}
                total={resultB.budget.summary.total}
                count={resultB.budget.summary.recordCount}
                source={resultB.budget.source}
                isHigher={resultB.budget.summary.total > resultA.budget.summary.total}
              />
            </section>

            {insight ? (
              <section className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
                Insight: {insight}
              </section>
            ) : null}

            <BarChartComparison
              municipalityA={resultA.org.title}
              municipalityB={resultB.org.title}
              totalA={resultA.budget.summary.total}
              totalB={resultB.budget.summary.total}
              year={year}
            />

            <PieChartComparison
              municipalityA={resultA.org.title}
              municipalityB={resultB.org.title}
              categoriesA={resultA.budget.summary.categories}
              categoriesB={resultB.budget.summary.categories}
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory}
            />

            <BudgetTableComparison
              municipalityA={resultA.org.title}
              municipalityB={resultB.org.title}
              recordsA={resultA.budget.records}
              recordsB={resultB.budget.records}
              activeCategory={activeCategory}
            />
          </>
        ) : null}
      </main>
    </>
  );
}
