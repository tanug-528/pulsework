import { clearFakeToday, setFakeToday } from "@/app/actions/dev";

// Development-only control: pretend today is another date to test Monday
// pulse checks and first-Monday monthly reassessments. Hidden in production.
export function DevDateTools({ fakeToday }: { fakeToday: string | null }) {
  return (
    <div className="mt-12 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
      <p className="font-medium text-slate-600">
        Demo tools <span className="font-normal">(development only)</span>
      </p>
      <p className="mt-0.5 text-xs">
        {fakeToday ? `Pretending today is ${fakeToday}.` : "Using the real date."} Pick a Monday to see the weekly pulse
        check, or the first Monday of a month for the monthly reassessment.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={setFakeToday} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="fake-date">
            Pretend today is
          </label>
          <input
            id="fake-date"
            type="date"
            name="date"
            required
            defaultValue={fakeToday ?? undefined}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-navy"
          />
          <button type="submit" className="rounded-lg bg-navy px-3 py-1.5 font-medium text-white hover:bg-navy-light">
            Pretend
          </button>
        </form>
        {fakeToday && (
          <form action={clearFakeToday}>
            <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-navy hover:bg-white">
              Back to real date
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
