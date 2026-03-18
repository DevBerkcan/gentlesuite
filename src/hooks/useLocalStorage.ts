import { useState, useCallback } from "react";

/**
 * useState-Ersatz der den Wert automatisch in localStorage speichert.
 * Überlebt Seitenwechsel und Browser-Tabs (gleicher Origin).
 * @param key     localStorage-Schlüssel (z.B. "draft:invoice-create")
 * @param initial Anfangswert (wird nur genutzt wenn noch nichts gespeichert ist)
 * @returns [value, setValue, clear]
 */
export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (v: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [key]
  );

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
    setState(initial);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setValue, clear];
}
