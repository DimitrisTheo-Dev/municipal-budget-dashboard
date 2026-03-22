import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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

function normalizeYearValues(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort(
    (first, second) => (Number.parseInt(second, 10) || 0) - (Number.parseInt(first, 10) || 0)
  );
}

function findBestAvailableYear(years = [], requestedYear = '') {
  const availableYears = normalizeYearValues(years);

  if (!availableYears.length) {
    return '';
  }

  if (requestedYear && availableYears.includes(requestedYear)) {
    return requestedYear;
  }

  const requestedYearNumber = Number.parseInt(requestedYear, 10);
  if (Number.isFinite(requestedYearNumber)) {
    const sameOrEarlierYear = availableYears.find(
      (value) => (Number.parseInt(value, 10) || 0) <= requestedYearNumber
    );
    if (sameOrEarlierYear) {
      return sameOrEarlierYear;
    }
  }

  return availableYears[0] || '';
}

function formatYears(values = []) {
  const years = normalizeYearValues(values);
  return years.length ? years.join(', ') : 'κανένα';
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { response, data };
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function LoadingSkeleton({ stageMessage }) {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4">
        <div className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute h-5 w-5 animate-ping rounded-full bg-brand-400/30" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-brand-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-brand-900">{stageMessage || 'Φόρτωση...'}</p>
          <p className="text-xs text-brand-600/80">Λήψη δεδομένων από Diavgeia</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-3 h-4 w-32" />
        <div className="skeleton mb-2 h-8 w-40" />
        <div className="skeleton h-3 w-20" />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-4 h-4 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-4 h-4 w-56" />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-100 p-4">
          <div className="skeleton h-44 w-44 rounded-full" />
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="skeleton h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-4 h-4 w-44" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, total, count }) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel transition-shadow hover:shadow-panel-lg">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(total)}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="badge-blue">{count} εγγραφές</span>
      </div>
    </article>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-12 text-center animate-in">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-red-900">Σφάλμα φόρτωσης</h3>
      <p className="mt-1 max-w-sm text-sm text-red-700/80">{message}</p>
      <button type="button" className="btn-primary mt-5" onClick={onRetry}>
        <RefreshIcon />
        Δοκίμασε ξανά
      </button>
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const abortRef = useRef(null);

  const municipality = asString(router.query.m1).trim();
  const year = asString(router.query.year).trim();

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const [result, setResult] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [resolvedYear, setResolvedYear] = useState('');
  const [yearNotice, setYearNotice] = useState('');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!municipality || !year) {
      setError('Λείπουν στοιχεία αναζήτησης. Επιστρέψτε στην αρχική σελίδα.');
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    async function runSearch() {
      setStatus('loading');
      setError('');
      setActiveCategory('');
      setResult(null);
      setLastUpdated('');
      setResolvedYear(year);
      setYearNotice('');
      setStageMessage('Αναζήτηση οργανισμού...');

      try {
        const { response: orgResponse, data: orgData } = await fetchJson(
          `/api/searchOrgs?term=${encodeURIComponent(municipality)}`,
          controller.signal
        );

        if (!orgResponse.ok || !orgData.selected) {
          throw new Error(`Δεν βρέθηκε οργανισμός για: ${municipality}`);
        }

        setStageMessage('Λήψη δαπανών...');

        async function fetchBudgetForOrg(selectedOrg, targetYear) {
          return fetchJson(
            `/api/budget?uid=${encodeURIComponent(
              selectedOrg.uid
            )}&year=${encodeURIComponent(targetYear)}&strictYear=1&orgTitle=${encodeURIComponent(
              selectedOrg.title
            )}`,
            controller.signal
          );
        }

        let nextResolvedYear = year;
        let fallbackNotice = '';
        let budgetResult = await fetchBudgetForOrg(orgData.selected, nextResolvedYear);
        let budgetResponse = budgetResult.response;
        let budgetData = budgetResult.data;

        if (budgetResponse.status === 409) {
          const fallbackYear = findBestAvailableYear(budgetData.availableYears, year);

          if (!fallbackYear) {
            throw new Error(
              `Δεν υπάρχουν δημοσιευμένα έτη για ${orgData.selected.title}. Διαθέσιμα έτη: ${formatYears(
                budgetData.availableYears
              )}.`
            );
          }

          nextResolvedYear = fallbackYear;
          fallbackNotice =
            year === fallbackYear
              ? ''
              : `Δεν βρέθηκαν δημοσιευμένες δαπάνες για το ${year}. Εμφανίζονται τα πιο πρόσφατα διαθέσιμα στοιχεία για το ${fallbackYear}.`;

          setStageMessage(`Λήψη δαπανών για το ${nextResolvedYear}...`);
          budgetResult = await fetchBudgetForOrg(orgData.selected, nextResolvedYear);
          budgetResponse = budgetResult.response;
          budgetData = budgetResult.data;
        }

        if (!budgetResponse.ok) {
          throw new Error(budgetData.error || `Αποτυχία φόρτωσης για ${orgData.selected.title}`);
        }

        setResult({
          query: municipality,
          org: orgData.selected,
          budget: budgetData
        });
        setResolvedYear(nextResolvedYear);
        setYearNotice(fallbackNotice);
        setLastUpdated(new Date().toISOString());
        setStatus('done');
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          setError('Η φόρτωση ακυρώθηκε.');
          setStatus('idle');
          return;
        }

        setError(fetchError.message || 'Παρουσιάστηκε σφάλμα κατά τη φόρτωση.');
        setStatus('error');
      }
    }

    runSearch();

    return () => {
      controller.abort();
    };
  }, [municipality, router.isReady, year, retryKey]);

  return (
    <>
      <Head>
        <title>
          {municipality ? `${municipality} | Budget Dashboard` : 'Results | Municipal Budget Dashboard'}
        </title>
      </Head>

      <div className="min-h-screen bg-gray-50/80">
        <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />

        <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 md:px-6 md:py-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                aria-label="Back to home"
              >
                <ArrowLeftIcon />
              </Link>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                  {municipality || '...'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="badge-blue">{resolvedYear || year || '...'}</span>
                  {resolvedYear && year && resolvedYear !== year ? (
                    <span>Ζητήθηκε: {year}</span>
                  ) : null}
                  {lastUpdated ? (
                    <span>
                      Ενημέρωση: {new Date(lastUpdated).toLocaleString('el-GR')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {(status === 'loading' || status === 'idle') && abortRef.current ? (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => abortRef.current?.abort()}
                >
                  Ακύρωση
                </button>
              ) : null}
              {status === 'done' ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRetryKey((value) => value + 1)}
                >
                  <RefreshIcon />
                  Ανανέωση
                </button>
              ) : null}
              <Link href="/" className="btn-secondary">
                Νέα αναζήτηση
              </Link>
            </div>
          </header>

          {status === 'loading' ? <LoadingSkeleton stageMessage={stageMessage} /> : null}

          {status === 'error' ? (
            <ErrorState
              message={`${error} Δοκίμασε ξανά ή άλλαξε το όνομα φορέα.`}
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          ) : null}

          {status === 'done' && result ? (
            <div className="space-y-5 animate-in">
              {yearNotice ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                  {yearNotice}
                </section>
              ) : null}

              <section className="grid gap-4">
                <SummaryCard
                  label={result.org.title}
                  total={result.budget.summary.total}
                  count={result.budget.summary.recordCount}
                />
              </section>

              <BarChartComparison
                municipalityA={result.org.title}
                municipalityB=""
                totalA={result.budget.summary.total}
                totalB={0}
                year={resolvedYear || year}
              />

              <PieChartComparison
                municipalityA={result.org.title}
                municipalityB=""
                categoriesA={result.budget.summary.categories}
                categoriesB={[]}
                activeCategory={activeCategory}
                onCategorySelect={setActiveCategory}
              />

              <BudgetTableComparison
                municipalityA={result.org.title}
                municipalityB=""
                recordsA={result.budget.records}
                recordsB={[]}
                activeCategory={activeCategory}
              />
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}
