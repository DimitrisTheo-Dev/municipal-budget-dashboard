import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function useOrgSuggestions(term) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/searchOrgs?term=${encodeURIComponent(term.trim())}`, {
          signal: controller.signal
        });
        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [term]);

  return { results, loading };
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default function CompareForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [municipality, setMunicipality] = useState('');
  const [year, setYear] = useState(String(currentYear - 1));
  const [formError, setFormError] = useState('');

  const { results: suggestions, loading } = useOrgSuggestions(municipality);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => String(currentYear - index));
  }, [currentYear]);

  const onReset = () => {
    setMunicipality('');
    setYear(String(currentYear - 1));
    setFormError('');
  };

  const onSubmit = (event) => {
    event.preventDefault();

    const normalizedMunicipality = municipality.trim();

    if (!normalizedMunicipality) {
      setFormError('Συμπλήρωσε έναν δήμο ή φορέα.');
      return;
    }

    setFormError('');
    const params = new URLSearchParams({
      m1: normalizedMunicipality,
      year
    });

    router.push(`/compare?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-5" aria-label="Municipality search form">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Αναζήτηση δήμων / φορέων</h2>
        <p className="mt-1 text-sm text-slate-500">
          Διάλεξε έναν φορέα για να δεις τα συνολικά ποσά, τις κατηγορίες και τις αναλυτικές εγγραφές.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="municipality" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Δήμος / Φορέας
        </label>
        <div className="relative">
          <input
            id="municipality"
            className="input pl-10"
            placeholder="π.χ. Σαλαμίνα"
            value={municipality}
            list="municipality-list"
            onChange={(event) => setMunicipality(event.target.value)}
          />
        </div>
        <datalist id="municipality-list">
          {suggestions.map((item) => (
            <option key={item.uid} value={item.title} />
          ))}
        </datalist>
        <div className="min-h-4 text-2xs text-slate-400" aria-live="polite">
          {loading ? 'Αναζήτηση...' : suggestions.length ? `${suggestions.length} αποτελέσματα` : ''}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="year" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Έτος
          </label>
          <select
            id="year"
            value={year}
            className="input w-28"
            onChange={(event) => setYear(event.target.value)}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Προβολή αποτελεσμάτων
            <ArrowRightIcon />
          </button>
          <button type="button" className="btn-ghost" onClick={onReset}>
            Καθαρισμός
          </button>
        </div>
      </div>

      {formError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          {formError}
        </div>
      ) : null}
    </form>
  );
}
