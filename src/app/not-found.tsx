import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Logo />
      <p className="mt-10 text-sm font-medium uppercase tracking-wider text-teal">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-navy">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">The link may be out of date, or the page may have moved.</p>
      <Link href="/" className="mt-6 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark">
        Back to PulseWork
      </Link>
    </main>
  );
}
