import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

const DIMENSIONS = ["Exhaustion", "Cynicism", "Efficacy", "Sense of control", "Recognition"];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.accountType === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo light />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/admin/login" className="text-white/70 hover:text-white">
              Employer login
            </Link>
            <Link href="/login" className="rounded-lg border border-white/20 px-3 py-1.5 text-white hover:bg-white/10">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-navy">
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:pt-24">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-light/80">Burnout, caught early</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Know how you&apos;re really doing — before it becomes burnout.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            A 5-minute assessment gives you a private burnout profile across five clinical dimensions.
            A 60-second weekly check-in keeps it current. Your employer only ever sees anonymous team trends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-lg bg-teal px-5 py-3 font-medium text-white hover:bg-teal-dark">
              Get started
            </Link>
            <Link href="/login" className="rounded-lg border border-white/20 px-5 py-3 font-medium text-white hover:bg-white/10">
              I have an account
            </Link>
          </div>

          <ul className="mt-14 flex flex-wrap gap-2">
            {DIMENSIONS.map((d) => (
              <li key={d} className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70">
                {d}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
