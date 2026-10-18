"use client";

import Link from "next/link";

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  autoComplete,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy">{label}</span>
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-navy placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-teal px-4 py-2.5 font-medium text-white transition hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function FormError({ message, link }: { message?: string; link?: { href: string; label: string } }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-risk/30 bg-risk-light px-3 py-2 text-sm text-risk">
      {message}{" "}
      {link && (
        <Link href={link.href} className="font-medium underline underline-offset-2">
          {link.label} →
        </Link>
      )}
    </p>
  );
}
