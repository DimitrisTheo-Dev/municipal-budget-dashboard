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

function findLatestCommonYear(yearsA = [], yearsB = [], requestedYear = '') {
  const normalizedYearsA = normalizeYearValues(yearsA);
  const normalizedYearsB = new Set(normalizeYearValues(yearsB));
  const commonYears = normalizedYearsA.filter((value) => normalizedYearsB.has(value));

  if (!commonYears.length) {
    return '';
  }

  if (requestedYear && commonYears.includes(requestedYear)) {
    return requestedYear;
  }

  const requestedYearNumber = Number.parseInt(requestedYear, 10);
  if (Number.isFinite(requestedYearNumber)) {
    const sameOrEarlierYear = commonYears.find(
      (value) => (Number.parseInt(value, 10) || 0) <= requestedYearNumber
    );
    if (sameOrEarlierYear) {
      return sameOrEarlierYear;
    }
  }

  return commonYears[0] || '';
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

/* ---- Icons ---- */

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

function TrendUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

/* ---- Loading skeleton ---- */

function LoadingSkeleton({ stageMessage }) {
  return (
    <div className="space-y-6 animate-in">
      {/* Stage indicator */}
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

      {/* Summary card skeletons */}
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
            <div className="skeleton mb-3 h-4 w-32" />
            <div className="skeleton mb-2 h-8 w-40" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-4 h-4 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>

      {/* Pie skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-4 h-4 w-56" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-slate-100 p-4">
              <div className="skeleton h-44 w-44 rounded-full" />
              <div className="flex gap-2">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="skeleton h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <div className="skeleton mb-4 h-4 w-44" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Summary card ---- */

function SummaryCard({ label, total, count, isHigher }) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel transition-shadow hover:shadow-panel-lg">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        {isHigher ? <TrendUpIcon /> : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(total)}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="badge-blue">{count} εγγραφές</span>
        {isHigher ? <span className="badge-rose">Υψηλότερες δαπάνες</span> : null}
      </div>
    </article>
  );
}

/* ---- Error state ---- */

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

/* ---- Main page ---- */

export default function ComparePage() {
  const router = useRouter();
  const abortRef = useRef(null);

  const municipalityAQuery = asString(router.query.m1).trim();
  const municipalityBQuery = asString(router.query.m2).trim();
  const municipalityA = municipalityAQuery || municipalityBQuery;
  const municipalityB = municipalityAQuery && municipalityBQuery ? municipalityBQuery : '';
  const year = asString(router.query.year).trim();
  const hasComparison = Boolean(municipalityB);

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stageMessage, setStageMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [comparisonYear, setComparisonYear] = useState('');
  const [yearNotice, setYearNotice] = useState('');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!municipalityA || !year) {
      setError('Λείπουν στοιχεία αναζήτησης. Επιστρέψτε στην αρχική σελίδα.');
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    async function runComparison() {
      setStatus('loading');
      setError('');
      setActiveCategory('');
      setResultA(null);
      setResultB(null);
      setLastUpdated('');
      setComparisonYear(year);
      setYearNotice('');
      setStageMessage(hasComparison ? 'Αναζήτηση οργανισμών...' : 'Αναζήτηση οργανισμού...');

      try {
        const orgResults = await Promise.all([
          fetchJson(`/api/searchOrgs?term=${encodeURIComponent(municipalityA)}`, controller.signal),
          ...(hasComparison
            ? [fetchJson(`/api/searchOrgs?term=${encodeURIComponent(municipalityB)}`, controller.signal)]
            : [])
        ]);

        const orgAResult = orgResults[0];
        const orgBResult = orgResults[1] || null;
        const orgAResponse = orgAResult.response;
        const orgAData = orgAResult.data;
        const orgBResponse = orgBResult?.response || null;
        const orgBData = orgBResult?.data || null;

        if (!orgAResponse.ok || !orgAData.selected) {
          throw new Error(`Δεν βρέθηκε οργανισμός για: ${municipalityA}`);
        }

        if (hasComparison && (!orgBResponse?.ok || !orgBData?.selected)) {
          throw new Error(`Δεν βρέθηκε οργανισμός για: ${municipalityB}`);
        }

        setStageMessage(hasComparison ? 'Λήψη δαπανών...' : 'Λήψη δαπανών...');

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

        let resolvedComparisonYear = year;
        let fallbackNotice = '';
        let budgetAResponse;
        let budgetAData;
        let budgetBResponse = null;
        let budgetBData = null;

        if (hasComparison) {
          async function fetchBudgetPair(targetYear) {
            const [budgetAResult, budgetBResult] = await Promise.all([
              fetchBudgetForOrg(orgAData.selected, targetYear),
              fetchBudgetForOrg(orgBData.selected, targetYear)
            ]);

            return {
              budgetAResponse: budgetAResult.response,
              budgetAData: budgetAResult.data,
              budgetBResponse: budgetBResult.response,
              budgetBData: budgetBResult.data
            };
          }

          ({ budgetAResponse, budgetAData, budgetBResponse, budgetBData } =
            await fetchBudgetPair(resolvedComparisonYear));

          if (budgetAResponse.status === 409 || budgetBResponse.status === 409) {
            const fallbackYear = findLatestCommonYear(
              budgetAData.availableYears,
              budgetBData.availableYears,
              year
            );

            if (!fallbackYear) {
              throw new Error(
                `Δεν υπάρχουν κοινά δημοσιευμένα έτη. ${orgAData.selected.title}: ${formatYears(
                  budgetAData.availableYears
                )}. ${orgBData.selected.title}: ${formatYears(budgetBData.availableYears)}.`
              );
            }

            resolvedComparisonYear = fallbackYear;
            fallbackNotice =
              year === fallbackYear
                ? ''
                : `Δεν βρέθηκαν δημοσιευμένες δαπάνες και για τους δύο φορείς για το ${year}. Εμφανίζονται τα πιο πρόσφατα κοινά στοιχεία για το ${fallbackYear}.`;

            setStageMessage(`Λήψη δαπανών για το ${resolvedComparisonYear}...`);

            ({ budgetAResponse, budgetAData, budgetBResponse, budgetBData } =
              await fetchBudgetPair(resolvedComparisonYear));
          }
        } else {
          let budgetAResult = await fetchBudgetForOrg(orgAData.selected, resolvedComparisonYear);
          budgetAResponse = budgetAResult.response;
          budgetAData = budgetAResult.data;

          if (budgetAResponse.status === 409) {
            const fallbackYear = findBestAvailableYear(budgetAData.availableYears, year);

            if (!fallbackYear) {
              throw new Error(
                `Δεν υπάρχουν δημοσιευμένα έτη για ${orgAData.selected.title}. Διαθέσιμα έτη: ${formatYears(
                  budgetAData.availableYears
                )}.`
              );
            }

            resolvedComparisonYear = fallbackYear;
            fallbackNotice =
              year === fallbackYear
                ? ''
                : `Δεν βρέθηκαν δημοσιευμένες δαπάνες για το ${year}. Εμφανίζονται τα πιο πρόσφατα διαθέσιμα στοιχεία για το ${fallbackYear}.`;

            setStageMessage(`Λήψη δαπανών για το ${resolvedComparisonYear}...`);
            budgetAResult = await fetchBudgetForOrg(orgAData.selected, resolvedComparisonYear);
            budgetAResponse = budgetAResult.response;
            budgetAData = budgetAResult.data;
          }
        }

        if (!budgetAResponse.ok) {
          throw new Error(budgetAData.error || `Αποτυχία φόρτωσης για ${orgAData.selected.title}`);
        }

        if (hasComparison && !budgetBResponse?.ok) {
          throw new Error(budgetBData.error || `Αποτυχία φόρτωσης για ${orgBData.selected.title}`);
        }

        setResultA({
          query: municipalityA,
          org: orgAData.selected,
          budget: budgetAData
        });

        setResultB(
          hasComparison
            ? {
                query: municipalityB,
                org: orgBData.selected,
                budget: budgetBData
              }
            : null
        );

        setComparisonYear(resolvedComparisonYear);
        setYearNotice(fallbackNotice);
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
  }, [hasComparison, municipalityA, municipalityB, router.isReady, year, retryKey]);

  const insight = useMemo(() => {
    if (!resultA || !resultB) {
      return null;
    }

    const totalA = resultA.budget.summary.total;
    const totalB = resultB.budget.summary.total;

    if (totalA === totalB) {
      return `Οι δύο φορείς έχουν ίσες συνολικές δαπάνες για το ${comparisonYear || year}.`;
    }

    const higher = totalA > totalB ? resultA.org.title : resultB.org.title;
    const lowerTotal = Math.min(totalA, totalB) || 1;
    const diffPercent = (((Math.max(totalA, totalB) - lowerTotal) / lowerTotal) * 100).toFixed(1);

    return `${higher} δαπάνησε ${diffPercent}% περισσότερο για το ${comparisonYear || year}.`;
  }, [comparisonYear, resultA, resultB, year]);

  return (
    <>
      <Head>
        <title>
          {municipalityA && municipalityB
            ? `${municipalityA} vs ${municipalityB} | Budget Dashboard`
            : municipalityA
              ? `${municipalityA} | Budget Dashboard`
              : 'Comparison | Municipal Budget Dashboard'}
        </title>
      </Head>

      <div className="min-h-screen bg-gray-50/80">
        <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />

        <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 md:px-6 md:py-8">
          {/* Header */}
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
                  {hasComparison ? (
                    <>
                      {municipalityA || '...'} <span className="font-normal text-slate-400">vs</span>{' '}
                      {municipalityB || '...'}
                    </>
                  ) : (
                    municipalityA || '...'
                  )}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="badge-blue">{comparisonYear || year || '...'}</span>
                  {comparisonYear && year && comparisonYear !== year ? (
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
                  onClick={() => setRetryKey((v) => v + 1)}
                >
                  <RefreshIcon />
                  Ανανέωση
                </button>
              ) : null}
              <Link href="/" className="btn-secondary">
                Νέα σύγκριση
              </Link>
            </div>
          </header>

          {/* Loading */}
          {status === 'loading' ? <LoadingSkeleton stageMessage={stageMessage} /> : null}

          {/* Error */}
          {status === 'error' ? (
            <ErrorState
              message={`${error} Δοκίμασε ξανά ή άλλαξε ονόματα δήμων.`}
              onRetry={() => setRetryKey((v) => v + 1)}
            />
          ) : null}

          {/* Results */}
          {status === 'done' && resultA && resultB ? (
            <div className="space-y-5 animate-in">
              {yearNotice ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                  {yearNotice}
                </section>
              ) : null}

              {/* Summary cards */}
              <section className={`grid gap-4 ${resultB ? 'md:grid-cols-2' : ''}`}>
                <SummaryCard
                  label={resultA.org.title}
                  total={resultA.budget.summary.total}
                  count={resultA.budget.summary.recordCount}
                  isHigher={Boolean(resultB) && resultA.budget.summary.total > resultB.budget.summary.total}
                />
                {resultB ? (
                  <SummaryCard
                    label={resultB.org.title}
                    total={resultB.budget.summary.total}
                    count={resultB.budget.summary.recordCount}
                    isHigher={resultB.budget.summary.total > resultA.budget.summary.total}
                  />
                ) : null}
              </section>

              {/* Insight */}
              {insight ? (
                <section className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                      <path d="M12 2v4" /><path d="m15.5 7.5 2.8-2.8" /><path d="M20 12h-4" />
                      <path d="m15.5 16.5 2.8 2.8" /><path d="M12 18v4" /><path d="m4.2 19.8 2.8-2.8" />
                      <path d="M4 12h4" /><path d="m4.2 4.2 2.8 2.8" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-brand-900">{insight}</p>
                </section>
              ) : null}

              <BarChartComparison
                municipalityA={resultA.org.title}
                municipalityB={resultB?.org.title || ''}
                totalA={resultA.budget.summary.total}
                totalB={resultB?.budget.summary.total || 0}
                year={comparisonYear || year}
              />

              <PieChartComparison
                municipalityA={resultA.org.title}
                municipalityB={resultB?.org.title || ''}
                categoriesA={resultA.budget.summary.categories}
                categoriesB={resultB?.budget.summary.categories || []}
                activeCategory={activeCategory}
                onCategorySelect={setActiveCategory}
              />

              <BudgetTableComparison
                municipalityA={resultA.org.title}
                municipalityB={resultB?.org.title || ''}
                recordsA={resultA.budget.records}
                recordsB={resultB?.budget.records || []}
                activeCategory={activeCategory}
              />
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}
