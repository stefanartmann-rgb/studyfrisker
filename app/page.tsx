import { FriskForm } from "./components/FriskForm";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          StudyFrisker
        </h1>
        <p className="text-sm text-gray-600 sm:text-base dark:text-gray-400">
          Grading how trustworthy health science really is.
        </p>
      </header>

      <FriskForm />
    </main>
  );
}
