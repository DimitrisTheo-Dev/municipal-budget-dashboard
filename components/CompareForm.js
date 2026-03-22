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

export default function CompareForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [municipalityA, setMunicipalityA] = useState('Σαλαμίνα');
  const [municipalityB, setMunicipalityB] = useState('Καλλιθέα');
  const [year, setYear] = useState(String(currentYear - 1));
  const [formError, setFormError] = useState('');

  const { results: suggestionsA, loading: loadingA } = useOrgSuggestions(municipalityA);
  const { results: suggestionsB, loading: loadingB } = useOrgSuggestions(municipalityB);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => String(currentYear - index));
  }, [currentYear]);

  const onSwap = () => {
    setMunicipalityA(municipalityB);
    setMunicipalityB(municipalityA);
  };

  const onReset = () => {
    setMunicipalityA('');
    setMunicipalityB('');
    setYear(String(currentYear - 1));
    setFormError('');
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (!municipalityA.trim() || !municipalityB.trim()) {
      setFormError('Συμπλήρωσε και τους δύο δήμους. / Fill in both municipalities.');
      return;
    }

    if (municipalityA.trim().toLowerCase() === municipalityB.trim().toLowerCase()) {
      setFormError('Επέλεξε δύο διαφορετικούς δήμους. / Please choose two different municipalities.');
      return;
    }

    setFormError('');
    router.push(
      `/compare?m1=${encodeURIComponent(municipalityA.trim())}&m2=${encodeURIComponent(
        municipalityB.trim()
      )}&year=${encodeURIComponent(year)}`
    );
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-4" aria-label="Municipality compare form">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Σύγκριση δήμων / Compare municipalities</h2>
        <p className="mt-1 text-sm text-slate-600">
          Πληκτρολόγησε ονόματα δήμων στα ελληνικά. Χρησιμοποίησε Enter για άμεση σύγκριση.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
        <div className="space-y-1">
          <label htmlFor="municipalityA" className="text-sm font-medium text-slate-700">
            Δήμος Α / Municipality A
          </label>
          <input
            id="municipalityA"
            className="input"
            placeholder="π.χ. Σαλαμίνα"
            value={municipalityA}
            list="municipality-a-list"
            onChange={(event) => setMunicipalityA(event.target.value)}
          />
          <datalist id="municipality-a-list">
            {suggestionsA.map((item) => (
              <option key={item.uid} value={item.title} />
            ))}
          </datalist>
          <div className="min-h-5 text-xs text-slate-500" aria-live="polite">
            {loadingA ? 'Αναζήτηση...' : suggestionsA.length ? `${suggestionsA.length} προτάσεις` : ''}
          </div>
        </div>

        <div className="flex items-end justify-center">
          <button
            type="button"
            className="btn-secondary w-full md:w-auto"
            onClick={onSwap}
            aria-label="Swap municipalities"
          >
            Αντιμετάθεση / Swap
          </button>
        </div>

        <div className="space-y-1">
          <label htmlFor="municipalityB" className="text-sm font-medium text-slate-700">
            Δήμος Β / Municipality B
          </label>
          <input
            id="municipalityB"
            className="input"
            placeholder="π.χ. Καλλιθέα"
            value={municipalityB}
            list="municipality-b-list"
            onChange={(event) => setMunicipalityB(event.target.value)}
          />
          <datalist id="municipality-b-list">
            {suggestionsB.map((item) => (
              <option key={item.uid} value={item.title} />
            ))}
          </datalist>
          <div className="min-h-5 text-xs text-slate-500" aria-live="polite">
            {loadingB ? 'Αναζήτηση...' : suggestionsB.length ? `${suggestionsB.length} προτάσεις` : ''}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="year" className="text-sm font-medium text-slate-700">
            Έτος / Year
          </label>
          <select
            id="year"
            value={year}
            className="input"
            onChange={(event) => setYear(event.target.value)}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          Σύγκριση / Compare
        </button>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Καθαρισμός / Reset
        </button>
      </div>
    </form>
  );
}
