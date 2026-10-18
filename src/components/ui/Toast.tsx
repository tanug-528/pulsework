"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A single toast at the bottom of the screen that disappears after a few seconds. */
export function useToast(durationMs = 3000) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toast = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {message && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white shadow-lg">
          <span className="h-2 w-2 rounded-full bg-teal-light" />
          {message}
        </div>
      )}
    </div>
  );

  return { show, toast };
}
