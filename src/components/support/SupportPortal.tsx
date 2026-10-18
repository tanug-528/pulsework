"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  PROVIDERS,
  RESOURCES,
  SESSIONS_PER_YEAR,
  SESSIONS_USED,
  SLOT_TIMES,
  isSlotOpen,
  nextWeekdays,
  type Provider,
} from "@/lib/support-data";

type Booking = { providerId: string; day: Date; time: string };
type ChatMessage = { from: "provider" | "me"; text: string; at: string };
type OpenModal = { kind: "book" | "notes" | "chat"; provider: Provider } | null;

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function formatDay(day: Date, style: "short" | "long" = "short"): string {
  return day.toLocaleDateString("en-US", {
    weekday: style === "long" ? "long" : "short",
    month: "short",
    day: "numeric",
  });
}

function slotKey(providerId: string, day: Date, time: string): string {
  return `${providerId}|${day.toDateString()}|${time}`;
}

export function SupportPortal({ nowIso, firstName }: { nowIso: string; firstName: string }) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const days = useMemo(() => nextWeekdays(now), [now]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modal, setModal] = useState<OpenModal>(null);
  const [lastBooked, setLastBooked] = useState<Booking | null>(null);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() =>
    Object.fromEntries(
      PROVIDERS.map((p) => [
        p.id,
        [{ from: "provider", text: p.openingMessage.replace("{firstName}", firstName), at: "2 days ago" }],
      ]),
    ),
  );
  const { show: showToast, toast } = useToast();

  const nextAppointment = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => a.day.getTime() - b.day.getTime() || a.time.localeCompare(b.time),
      )[0] ?? null,
    [bookings],
  );

  function book(provider: Provider, day: Date, time: string) {
    const booking = { providerId: provider.id, day, time };
    setBookings((prev) => [...prev, booking]);
    setLastBooked(booking);
  }

  function send(provider: Provider, text: string) {
    setChats((prev) => ({ ...prev, [provider.id]: [...prev[provider.id], { from: "me", text, at: "Just now" }] }));
  }

  function openModal(kind: "book" | "notes" | "chat", provider: Provider) {
    setLastBooked(null);
    setModal({ kind, provider });
  }

  const nextProvider = nextAppointment && PROVIDERS.find((p) => p.id === nextAppointment.providerId);

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions remaining this year" icon={<CalendarIcon />}>
          <p className="text-3xl font-semibold text-navy">{SESSIONS_PER_YEAR - SESSIONS_USED}</p>
          <p className="mt-1 text-xs text-slate-500">
            {SESSIONS_USED} of {SESSIONS_PER_YEAR} used
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal" style={{ width: `${(SESSIONS_USED / SESSIONS_PER_YEAR) * 100}%` }} />
          </div>
        </StatCard>
        <StatCard label="Next appointment" icon={<ClockIcon />}>
          {nextAppointment && nextProvider ? (
            <>
              <p className="text-lg font-semibold text-navy">
                {formatDay(nextAppointment.day)} · {formatTime(nextAppointment.time)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                With {nextProvider.name} · <span className="text-teal">awaiting confirmation</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-navy">Not scheduled</p>
              <p className="mt-1 text-xs text-slate-500">Book with a provider below</p>
            </>
          )}
        </StatCard>
        <StatCard label="Your care team" icon={<PeopleIcon />}>
          <p className="text-3xl font-semibold text-navy">{PROVIDERS.length}</p>
          <p className="mt-1 text-xs text-slate-500">providers assigned</p>
        </StatCard>
      </div>

      {/* Care team */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Your care team</h2>
        <p className="mb-4 mt-0.5 text-sm text-slate-500">Licensed professionals matched to your needs.</p>
        <div className="grid gap-6 lg:grid-cols-2">
          {PROVIDERS.map((p) => (
            <ProviderCard key={p.id} provider={p} onAction={(kind) => openModal(kind, p)} />
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Resources</h2>
        <p className="mb-4 mt-0.5 text-sm text-slate-500">Self-guided support you can use any time.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {RESOURCES.map((r) => (
            <div key={r.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="w-fit rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-medium text-teal-dark">{r.meta}</span>
              <h3 className="mt-3 font-semibold text-navy">{r.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">{r.description}</p>
              <button
                type="button"
                onClick={() => showToast(`"${r.title}" is coming soon.`)}
                className="mt-4 w-fit rounded-lg border border-teal px-3 py-1.5 text-sm font-medium text-teal hover:bg-teal-light"
              >
                Open resource
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {modal?.kind === "book" && (
        <Modal
          open
          size="lg"
          onClose={() => setModal(null)}
          title={`Book with ${modal.provider.name}`}
          subtitle="50-minute video session · covered by your employer"
        >
          <BookingCalendar
            provider={modal.provider}
            days={days}
            bookings={bookings}
            onBook={(day, time) => book(modal.provider, day, time)}
          />
          {lastBooked && lastBooked.providerId === modal.provider.id && (
            <div role="status" className="mt-5 flex items-start gap-3 rounded-xl border border-healthy/30 bg-healthy-light p-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-healthy text-xs text-white">✓</span>
              <div className="text-sm">
                <p className="font-semibold text-navy">Appointment requested. You will receive a confirmation email shortly.</p>
                <p className="mt-0.5 text-slate-600">
                  {formatDay(lastBooked.day, "long")} at {formatTime(lastBooked.time)} with {modal.provider.name}.
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {modal?.kind === "notes" && (
        <Modal open onClose={() => setModal(null)} title="Session notes" subtitle={`Shared by ${modal.provider.name}`}>
          <ol className="space-y-5">
            {modal.provider.notes.map((n) => {
              const date = new Date(now.getTime() - n.daysAgo * 24 * 60 * 60 * 1000);
              return (
                <li key={n.title} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <h3 className="mt-1 font-semibold text-navy">{n.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{n.body}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-slate-400">Notes are visible only to you and your provider. Your employer never sees them.</p>
        </Modal>
      )}

      {modal?.kind === "chat" && (
        <Modal open onClose={() => setModal(null)} title={modal.provider.name} subtitle="Secure message · usually replies within 1 business day">
          <ChatThread
            provider={modal.provider}
            messages={chats[modal.provider.id]}
            onSend={(text) => send(modal.provider, text)}
          />
        </Modal>
      )}

      {toast}
    </>
  );
}

function StatCard({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-light text-teal">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function ProviderCard({ provider: p, onAction }: { provider: Provider; onAction: (kind: "book" | "notes" | "chat") => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-navy text-xl font-semibold text-white ring-4 ring-teal-light"
        >
          {p.initials}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-navy">{p.name}</h3>
          <p className="text-sm text-slate-600">{p.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <StarRating rating={p.rating} />
            <span className="text-slate-400">({p.reviews} reviews)</span>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-slate-500">Specializes in</dt>
          <dd className="mt-0.5 font-medium text-navy">{p.specialization}</dd>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-slate-500">Experience</dt>
          <dd className="mt-0.5 font-medium text-navy">{p.yearsExperience} years</dd>
        </div>
      </dl>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{p.bio}</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onAction("book")}
          className="rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal-dark"
        >
          Book appointment
        </button>
        <button
          type="button"
          onClick={() => onAction("chat")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-navy hover:bg-surface"
        >
          Send message
        </button>
        <button
          type="button"
          onClick={() => onAction("notes")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-navy hover:bg-surface"
        >
          View notes
        </button>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5`}>
      <span className="relative inline-block text-base leading-none tracking-tight text-slate-200" aria-hidden="true">
        ★★★★★
        <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-400" style={{ width: `${(rating / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="font-medium text-navy">{rating.toFixed(1)}</span>
    </span>
  );
}

function BookingCalendar({
  provider,
  days,
  bookings,
  onBook,
}: {
  provider: Provider;
  days: Date[];
  bookings: Booking[];
  onBook: (day: Date, time: string) => void;
}) {
  const booked = new Set(bookings.map((b) => slotKey(b.providerId, b.day, b.time)));

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">Choose a time that works for you. All times are in your local time zone.</p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-5 gap-2">
          {days.map((day) => (
            <div key={day.toDateString()}>
              <div className="mb-2 rounded-lg bg-surface py-2 text-center">
                <p className="text-xs font-medium uppercase text-slate-500">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="text-sm font-semibold text-navy">
                  {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="space-y-1.5">
                {SLOT_TIMES.map((time) => {
                  const isBooked = booked.has(slotKey(provider.id, day, time));
                  const open = isSlotOpen(provider.id, day, time);
                  if (isBooked) {
                    return (
                      <div
                        key={time}
                        className="rounded-lg border border-teal bg-teal-light px-1 py-2 text-center text-xs font-semibold text-teal-dark"
                      >
                        ✓ Booked
                        <span className="block font-normal">{formatTime(time)}</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={!open}
                      onClick={() => onBook(day, time)}
                      aria-label={open ? `Book ${formatDay(day, "long")} at ${formatTime(time)}` : undefined}
                      className="block w-full rounded-lg border border-slate-200 px-1 py-2 text-center text-xs font-medium text-navy transition hover:border-teal hover:bg-teal-light disabled:cursor-not-allowed disabled:border-transparent disabled:bg-slate-50 disabled:text-slate-300 disabled:line-through"
                    >
                      {formatTime(time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatThread({
  provider,
  messages,
  onSend,
}: {
  provider: Provider;
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-3" aria-live="polite">
        {messages.map((m, i) =>
          m.from === "provider" ? (
            <div key={i} className="flex items-end gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-navy text-xs font-semibold text-white">
                {provider.initials}
              </span>
              <div className="max-w-[80%]">
                <p className="rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5 text-sm text-navy">{m.text}</p>
                <p className="mt-1 text-xs text-slate-400">{m.at}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] text-right">
                <p className="rounded-2xl rounded-br-sm bg-teal px-4 py-2.5 text-left text-sm text-white">{m.text}</p>
                <p className="mt-1 text-xs text-slate-400">{m.at} · Sent</p>
              </div>
            </div>
          ),
        )}
      </div>
      <form onSubmit={submit} className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
        <label htmlFor="chat-input" className="sr-only">
          Message {provider.name}
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          data-autofocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </svg>
  );
}
