export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Frisk
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">Frisking…</p>
      </header>
      <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-primary"
        />
        <p className="mt-4 text-sm text-ink/70">
          This usually takes 10 to 20 seconds.
        </p>
      </div>
    </main>
  );
}
