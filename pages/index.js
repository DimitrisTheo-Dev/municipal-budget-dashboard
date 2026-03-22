import Head from 'next/head';
import CompareForm from '../components/CompareForm';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Municipal Budget Dashboard</title>
        <meta
          name="description"
          content="View or compare annual municipal spendings in Greece using Diavgeia Open Data."
        />
      </Head>

      <div className="min-h-screen bg-gray-50/80">
        {/* Subtle top accent */}
        <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />

        <main className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-20">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              <span className="text-2xs font-semibold uppercase tracking-widest text-brand-700">
                Diavgeia Open Data
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Municipal Budget Dashboard
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-500">
              Δες τις δαπάνες ενός ελληνικού φορέα ή σύγκρινε δύο φορείς, με κατανομή κατηγοριών και αναλυτικές εγγραφές.
            </p>
          </div>

          <CompareForm />

          <footer className="mt-12 text-center text-xs text-slate-400">
            Data source: Diavgeia Open Data API &middot; diavgeia.gov.gr
          </footer>
        </main>
      </div>
    </>
  );
}
