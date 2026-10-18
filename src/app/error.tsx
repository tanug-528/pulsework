"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold text-navy">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Sorry about that. Your saved answers are safe. Try again, or head back to the start.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-white">
          Go home
        </Link>
      </div>
    </main>
  );
}
