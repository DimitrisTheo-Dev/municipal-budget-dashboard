import { useEffect, useMemo, useState } from 'react';

function formatCurrency(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(value || 0);
}

function parseDateToTimestamp(value) {
  if (!value || typeof value !== 'string') return 0;
  const parts = value.split('/');
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts.map((part) => Number.parseInt(part, 10));
  if (!day || !month || !year) return 0;
  return new Date(year, month - 1, day).getTime();
}

function sortRecords(records, sortBy, sortDir) {
  const sorted = [...records];
  sorted.sort((a, b) => {
    let first = 0;
    let second = 0;
    if (sortBy === 'amount') {
      first = Number(a.amount || 0);
      second = Number(b.amount || 0);
    } else if (sortBy === 'date') {
      first = parseDateToTimestamp(a.date);
      second = parseDateToTimestamp(b.date);
    } else {
      first = String(a.title || '').toLowerCase();
      second = String(b.title || '').toLowerCase();
    }
    if (first < second) return sortDir === 'asc' ? -1 : 1;
    if (first > second) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" /><path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function RecordTable({ title, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-2xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-2.5 font-semibold">Ημερομηνία</th>
              <th className="px-4 py-2.5 font-semibold">Κατηγορία</th>
              <th className="px-4 py-2.5 font-semibold">Περιγραφή</th>
              <th className="px-4 py-2.5 font-semibold">Δικαιούχος</th>
              <th className="px-4 py-2.5 text-right font-semibold">Ποσό</th>
              <th className="px-4 py-2.5 text-right font-semibold">Πηγή</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.uid} className="align-top transition-colors hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{row.date || '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block max-w-[140px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-600">
                      {row.category || '-'}
                    </span>
                  </td>
                  <td className="max-w-[240px] px-4 py-2.5 text-xs text-slate-700">
                    <span className="line-clamp-2">{row.title || '-'}</span>
                  </td>
                  <td className="max-w-[160px] px-4 py-2.5 text-xs text-slate-500">
                    <span className="line-clamp-1">{row.payee || '-'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold tabular-nums text-slate-900">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {row.decisionUrl ? (
                      <a
                        href={row.decisionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-800"
                      >
                        Diavgeia
                        <ExternalLinkIcon />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  Δεν βρέθηκαν εγγραφές.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BudgetTableComparison({
  municipalityA,
  municipalityB,
  recordsA = [],
  recordsB = [],
  activeCategory
}) {
  const [searchText, setSearchText] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('amount');
  const [sortDir, setSortDir] = useState('desc');

  const normalizedSearch = searchText.trim().toLowerCase();
  const hasComparison = Boolean(municipalityB);

  const filteredA = useMemo(() => {
    const min = Number.parseFloat(minAmount || '0') || 0;
    return sortRecords(
      recordsA.filter((item) => {
        const matchesCategory = activeCategory ? item.category === activeCategory : true;
        const haystack = `${item.title} ${item.category} ${item.payee}`.toLowerCase();
        const matchesSearch = normalizedSearch ? haystack.includes(normalizedSearch) : true;
        const matchesAmount = Number(item.amount || 0) >= min;
        return matchesCategory && matchesSearch && matchesAmount;
      }),
      sortBy,
      sortDir
    );
  }, [recordsA, activeCategory, normalizedSearch, minAmount, sortBy, sortDir]);

  const filteredB = useMemo(() => {
    const min = Number.parseFloat(minAmount || '0') || 0;
    return sortRecords(
      recordsB.filter((item) => {
        const matchesCategory = activeCategory ? item.category === activeCategory : true;
        const haystack = `${item.title} ${item.category} ${item.payee}`.toLowerCase();
        const matchesSearch = normalizedSearch ? haystack.includes(normalizedSearch) : true;
        const matchesAmount = Number(item.amount || 0) >= min;
        return matchesCategory && matchesSearch && matchesAmount;
      }),
      sortBy,
      sortDir
    );
  }, [recordsB, activeCategory, normalizedSearch, minAmount, sortBy, sortDir]);

  const pageCount = Math.max(
    1,
    Math.ceil(
      (hasComparison ? Math.max(filteredA.length, filteredB.length) : filteredA.length) /
        Number(rowsPerPage || 10)
    )
  );

  useEffect(() => {
    setPage(1);
  }, [searchText, minAmount, rowsPerPage, sortBy, sortDir, activeCategory]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const rowsA = filteredA.slice(start, end);
  const rowsB = filteredB.slice(start, end);

  return (
    <section className="card space-y-5" aria-label="Budget table comparison">
      {/* Header + filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Εγγραφές δαπανών</h3>
            <p className="text-xs text-slate-500">
              {activeCategory ? (
                <>
                  Φίλτρο: <span className="font-medium text-brand-700">{activeCategory}</span>
                </>
              ) : (
                `${filteredA.length + (hasComparison ? filteredB.length : 0)} συνολικές εγγραφές`
              )}
            </p>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Αναζήτηση..."
              className="input w-48 pl-9"
              aria-label="Search records"
            />
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
            placeholder="Ελάχ. ποσό"
            className="input w-32"
            aria-label="Minimum amount"
          />
          <select
            className="input w-40"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort by"
          >
            <option value="amount">Ποσό</option>
            <option value="date">Ημερομηνία</option>
            <option value="title">Τίτλος</option>
          </select>
          <select
            className="input w-28"
            value={sortDir}
            onChange={(event) => setSortDir(event.target.value)}
            aria-label="Sort direction"
          >
            <option value="desc">Φθίνουσα</option>
            <option value="asc">Αύξουσα</option>
          </select>
          <select
            className="input w-28"
            value={rowsPerPage}
            onChange={(event) => setRowsPerPage(Number(event.target.value))}
            aria-label="Rows per page"
          >
            <option value={10}>10 / σελ</option>
            <option value={20}>20 / σελ</option>
            <option value={30}>30 / σελ</option>
          </select>
        </div>
      </div>

      {/* Tables */}
      <div className={`grid gap-4 ${hasComparison ? 'xl:grid-cols-2' : ''}`}>
        <RecordTable title={municipalityA} rows={rowsA} />
        {hasComparison ? <RecordTable title={municipalityB} rows={rowsB} /> : null}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Σελίδα {page} / {pageCount}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="btn-secondary !px-2.5"
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={page >= pageCount}
            className="btn-secondary !px-2.5"
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
