import { useEffect, useState } from 'react';

/** useState yang otomatis disimpan ke localStorage (data simulasi di browser). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Abaikan jika storage penuh / diblokir.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
