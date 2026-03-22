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

function RecordTable({ title, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Ημερομηνία</th>
              <th className="px-3 py-2">Κατηγορία</th>
              <th className="px-3 py-2">Περιγραφή</th>
              <th className="px-3 py-2">Δικαιούχος</th>
              <th className="px-3 py-2 text-right">Ποσό</th>
              <th className="px-3 py-2 text-right">Ενέργεια</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.uid} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-3 py-2 text-slate-700">{row.date || '-'}</td>
                  <td className="px-3 py-2 text-slate-700">{row.category || '-'}</td>
                  <td className="px-3 py-2 text-slate-700">{row.title || '-'}</td>
                  <td className="px-3 py-2 text-slate-700">{row.payee || '-'}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.decisionUrl ? (
                      <a
                        href={row.decisionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 underline-offset-2 hover:underline"
                      >
                        Απόφαση
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                  Δεν υπάρχουν εγγραφές για τα ενεργά φίλτρα.
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
  recordsA,
  recordsB,
  activeCategory
}) {
  const [searchText, setSearchText] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('amount');
  const [sortDir, setSortDir] = useState('desc');

  const normalizedSearch = searchText.trim().toLowerCase();

  // Table updates whenever chart-selected category or local filters change.
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
    Math.ceil(Math.max(filteredA.length, filteredB.length) / Number(rowsPerPage || 10))
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
    <section className="card space-y-4" aria-label="Budget table comparison">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Εγγραφές δαπανών / Spending records</h3>
          <p className="text-sm text-slate-600">
            {activeCategory
              ? `Ενεργό φίλτρο κατηγορίας: ${activeCategory}`
              : 'Χωρίς φίλτρο κατηγορίας / No category filter'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Αναζήτηση τίτλου..."
            className="input w-48"
            aria-label="Search records"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
            placeholder="Ελάχιστο ποσό"
            className="input w-36"
            aria-label="Minimum amount"
          />
          <select
            className="input w-40"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort by"
          >
            <option value="amount">Ταξινόμηση: Ποσό</option>
            <option value="date">Ταξινόμηση: Ημερομηνία</option>
            <option value="title">Ταξινόμηση: Τίτλος</option>
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
            className="input w-32"
            value={rowsPerPage}
            onChange={(event) => setRowsPerPage(Number(event.target.value))}
            aria-label="Rows per page"
          >
            <option value={10}>10 / σελίδα</option>
            <option value={20}>20 / σελίδα</option>
            <option value={30}>30 / σελίδα</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecordTable title={municipalityA} rows={rowsA} />
        <RecordTable title={municipalityB} rows={rowsB} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="text-sm text-slate-600">
          Σελίδα {page} από {pageCount}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="btn-secondary"
          >
            Προηγούμενη
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={page >= pageCount}
            className="btn-secondary"
          >
            Επόμενη
          </button>
        </div>
      </div>
    </section>
  );
}
