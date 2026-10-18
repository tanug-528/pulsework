import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";

export function AppHeader({ name, label }: { name: string; label?: string }) {
  return (
    <header className="bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo light />
          {label && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">{label}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span className="hidden sm:inline">{name}</span>
          <form action={logout}>
            <button type="submit" className="rounded-lg border border-white/20 px-3 py-1.5 text-white hover:bg-white/10">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
