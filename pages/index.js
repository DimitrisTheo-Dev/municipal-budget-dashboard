import Head from 'next/head';
import CompareForm from '../components/CompareForm';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Municipal Budget Dashboard</title>
        <meta
          name="description"
          content="Compare annual municipal spendings in Greece using Diavgeia Open Data."
        />
      </Head>

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <section className="mb-6 rounded-2xl bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-6 py-8 text-white shadow-panel">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-100">Municipal Budget Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
            Σύγκριση δημοτικών δαπανών σε λίγα δευτερόλεπτα
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-brand-50 md:text-base">
            Γράψε δύο δήμους και έτος για να δεις σύνολα, κατανομή κατηγοριών και επιμέρους εγγραφές.
            Data source: Diavgeia Open Data API.
          </p>
        </section>

        <CompareForm />
      </main>
    </>
  );
}
