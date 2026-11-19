import { useCallback, useRef } from 'react';

/**
 * Notifikasi suara & getar saat order masuk.
 * Browser mewajibkan interaksi pengguna sebelum audio boleh diputar,
 * jadi panggil `unlock()` dari klik tombol (mis. "Mulai Narik").
 */
export function useDriverSound(enabled: boolean, vibrate: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) ctxRef.current = new Ctor();
      }
      void ctxRef.current?.resume();
    } catch {
      // Audio tidak didukung.
    }
  }, []);

  const playAlert = useCallback(() => {
    if (vibrate && 'vibrate' in navigator) {
      navigator.vibrate([400, 150, 400, 150, 400]);
    }
    if (!enabled) return;
    unlock();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    // Tiga kali nada ganda "ding-dong".
    for (let i = 0; i < 3; i++) {
      [880, 1320].forEach((freq, j) => {
        const start = now + i * 0.6 + j * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    }
  }, [enabled, vibrate, unlock]);

  return { unlock, playAlert };
}
