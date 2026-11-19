import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLngPoint } from '../data/jalanKitaData';

export interface RealtimeGpsState {
  coords: LatLngPoint | null;
  accuracyMeters: number | null;
  heading: number | null;
  speedMps: number | null;
  updatedAt: number | null;
  watching: boolean;
  error: string | null;
}

/**
 * Pelacakan GPS realtime menggunakan `navigator.geolocation.watchPosition`.
 * Saat `enabled` = true, posisi terus dipantau setiap perangkat bergerak.
 */
export function useRealtimeGps(
  enabled: boolean,
  onPosition?: (pos: LatLngPoint, meta: { accuracy: number; heading: number | null; speed: number | null }) => void
) {
  const [state, setState] = useState<RealtimeGpsState>({
    coords: null,
    accuracyMeters: null,
    heading: null,
    speedMps: null,
    updatedAt: null,
    watching: false,
    error: null,
  });

  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const pt: LatLngPoint = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    const accuracy = Math.round(pos.coords.accuracy);
    const heading = typeof pos.coords.heading === 'number' && !Number.isNaN(pos.coords.heading) ? pos.coords.heading : null;
    const speed = typeof pos.coords.speed === 'number' && !Number.isNaN(pos.coords.speed) ? pos.coords.speed : null;

    setState({
      coords: pt,
      accuracyMeters: accuracy,
      heading,
      speedMps: speed,
      updatedAt: Date.now(),
      watching: watchIdRef.current !== null,
      error: null,
    });
    onPositionRef.current?.(pt, { accuracy, heading, speed });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const msg =
      err.code === 1
        ? 'Izin lokasi GPS ditolak di browser.'
        : err.code === 2
          ? 'Sinyal GPS tidak tersedia.'
          : 'Waktu pencarian GPS habis.';
    setState((prev) => ({
      ...prev,
      watching: false,
      error: msg,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setState((prev) => ({ ...prev, watching: false }));
      return;
    }

    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        watching: false,
        error: 'Perangkat tidak mendukung GPS.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, watching: true, error: null }));
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 12000,
    });
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, handleSuccess, handleError]);

  const requestOnce = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({ ...prev, error: 'Perangkat tidak mendukung GPS.' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }, [handleSuccess, handleError]);

  return {
    ...state,
    requestOnce,
  };
}
