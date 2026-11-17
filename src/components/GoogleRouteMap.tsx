import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Map as GoogleMap } from '@vis.gl/react-google-maps';
import { Crosshair, ExternalLink, Navigation } from 'lucide-react';
import {
  DRIVER_OFFSET_KM,
  SERVICE_RADIUS_KM,
  buildGoogleMapsDirectionsUrl,
  haversineKm,
  interpolateAlongPath,
  isQuotaOrAuthError,
  offsetPointByKm,
  type LatLngPoint,
  type SelectedLocation,
  type ServiceId,
} from '../data/jalanKitaData';

export const MapsAvailabilityContext = createContext<boolean>(false);

export interface ComputedRouteStats {
  distanceKm: number;
  durationMinutes: number;
  path: LatLngPoint[];
}

export interface LiveDriverTelemetry {
  position: LatLngPoint;
  heading: number;
  remainingKm: number;
  etaMinutes: number;
  phaseLabel: string;
}

interface GoogleRouteMapProps {
  origin: SelectedLocation;
  destination: SelectedLocation;
  travelMode: 'DRIVING' | 'TWO_WHEELER';
  outOfArea?: boolean;
  heightClass?: string;
  onRouteComputed?: (stats: ComputedRouteStats) => void;
  tracking?: {
    step: number;
    totalSteps: number;
    driverName: string;
    driverPlate: string;
    service: ServiceId;
    onTelemetry?: (telemetry: LiveDriverTelemetry) => void;
  };
}

function toLatLngLiteral(pt: unknown): LatLngPoint | null {
  if (!pt || typeof pt !== 'object') return null;
  const anyPt = pt as {
    lat?: number | (() => number);
    lng?: number | (() => number);
    latitude?: number;
    longitude?: number;
  };
  if (typeof anyPt.lat === 'function' && typeof anyPt.lng === 'function') {
    return { lat: anyPt.lat(), lng: anyPt.lng() };
  }
  if (typeof anyPt.lat === 'number' && typeof anyPt.lng === 'number') {
    return { lat: anyPt.lat, lng: anyPt.lng };
  }
  if (typeof anyPt.latitude === 'number' && typeof anyPt.longitude === 'number') {
    return { lat: anyPt.latitude, lng: anyPt.longitude };
  }
  return null;
}

function RoutePolylineController({
  originCoords,
  destinationCoords,
  travelMode,
  outOfArea,
  shouldFitBounds,
  onRouteComputed,
  onRouteError,
}: {
  originCoords: LatLngPoint | null;
  destinationCoords: LatLngPoint | null;
  travelMode: 'DRIVING' | 'TWO_WHEELER';
  outOfArea?: boolean;
  shouldFitBounds: boolean;
  onRouteComputed: (stats: ComputedRouteStats) => void;
  onRouteError: (msg: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !routesLib || !originCoords || !destinationCoords) return;

    const isSame =
      Math.abs(originCoords.lat - destinationCoords.lat) < 0.0001 &&
      Math.abs(originCoords.lng - destinationCoords.lng) < 0.0001;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (isSame) {
      map.panTo(originCoords);
      map.setZoom(15);
      return;
    }

    let cancelled = false;

    const computeWithFallback = async () => {
      onRouteError(null);
      const RouteCtor = (routesLib as unknown as {
        Route: {
          computeRoutes: (req: Record<string, unknown>) => Promise<{ routes?: unknown[] }>;
        };
      }).Route;

      if (!RouteCtor?.computeRoutes) return;

      const tryCompute = async (mode: 'DRIVING' | 'TWO_WHEELER') => {
        return RouteCtor.computeRoutes({
          origin: originCoords,
          destination: destinationCoords,
          travelMode: mode,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
        });
      };

      try {
        let res = await tryCompute(travelMode);
        if ((!res?.routes || res.routes.length === 0) && travelMode === 'TWO_WHEELER') {
          res = await tryCompute('DRIVING');
        }

        if (cancelled) return;

        const primaryRoute = res?.routes?.[0] as
          | {
              path?: unknown[];
              distanceMeters?: number;
              durationMillis?: number;
              viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
              createPolylines?: () => google.maps.Polyline[];
            }
          | undefined;

        if (!primaryRoute) {
          onRouteError('Rute tidak ditemukan untuk titik ini.');
          return;
        }

        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines = primaryRoute.createPolylines();
          newPolylines.forEach((polyline) => {
            polyline.setOptions({
              strokeColor: outOfArea ? '#D9383E' : '#0F9D8A',
              strokeOpacity: 0.92,
              strokeWeight: 5,
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }

        if (shouldFitBounds && primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        const extractedPath: LatLngPoint[] = (primaryRoute.path ?? [])
          .map(toLatLngLiteral)
          .filter((p): p is LatLngPoint => p !== null);

        const fallbackPath =
          extractedPath.length >= 2
            ? extractedPath
            : [originCoords, destinationCoords];

        const distKm =
          typeof primaryRoute.distanceMeters === 'number' && primaryRoute.distanceMeters > 0
            ? primaryRoute.distanceMeters / 1000
            : Math.max(0.8, haversineKm(originCoords, destinationCoords) * 1.3);

        const durationMin =
          typeof primaryRoute.durationMillis === 'number' && primaryRoute.durationMillis > 0
            ? Math.max(1, Math.ceil(primaryRoute.durationMillis / 60000))
            : Math.ceil(distKm * 3 + 3);

        onRouteComputed({
          distanceKm: distKm,
          durationMinutes: durationMin,
          path: fallbackPath,
        });
      } catch (err) {
        if (cancelled) return;
        if (isQuotaOrAuthError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        // Fallback straight path calculation when a rural two-wheeler route isn't indexed
        if (travelMode === 'TWO_WHEELER') {
          try {
            const res = await tryCompute('DRIVING');
            if (cancelled) return;
            const primaryRoute = res?.routes?.[0] as
              | {
                  path?: unknown[];
                  distanceMeters?: number;
                  durationMillis?: number;
                  viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
                  createPolylines?: () => google.maps.Polyline[];
                }
              | undefined;
            if (primaryRoute) {
              if (typeof primaryRoute.createPolylines === 'function') {
                const newPolylines = primaryRoute.createPolylines();
                newPolylines.forEach((polyline) => {
                  polyline.setOptions({
                    strokeColor: outOfArea ? '#D9383E' : '#0F9D8A',
                    strokeOpacity: 0.92,
                    strokeWeight: 5,
                  });
                  polyline.setMap(map);
                });
                polylinesRef.current = newPolylines;
              }
              if (shouldFitBounds && primaryRoute.viewport) {
                map.fitBounds(primaryRoute.viewport, 48);
              }
              const extractedPath = (primaryRoute.path ?? [])
                .map(toLatLngLiteral)
                .filter((p): p is LatLngPoint => p !== null);
              onRouteComputed({
                distanceKm:
                  typeof primaryRoute.distanceMeters === 'number'
                    ? primaryRoute.distanceMeters / 1000
                    : Math.max(0.8, haversineKm(originCoords, destinationCoords) * 1.3),
                durationMinutes:
                  typeof primaryRoute.durationMillis === 'number'
                    ? Math.max(1, Math.ceil(primaryRoute.durationMillis / 60000))
                    : 5,
                path:
                  extractedPath.length >= 2
                    ? extractedPath
                    : [originCoords, destinationCoords],
              });
              return;
            }
          } catch (retryErr) {
            if (isQuotaOrAuthError(retryErr)) {
              window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
            }
          }
        }
        onRouteError('Tidak dapat memuat jalur rute Google Maps saat ini.');
      }
    };

    void computeWithFallback();

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    map,
    routesLib,
    originCoords,
    destinationCoords,
    travelMode,
    outOfArea,
    shouldFitBounds,
    onRouteComputed,
    onRouteError,
  ]);

  return null;
}

function LiveDriverOverlay({
  originCoords,
  destinationCoords,
  routePath,
  totalDistanceKm,
  totalDurationMin,
  step,
  totalSteps,
  driverName,
  driverPlate,
  followDriver,
  onTelemetry,
}: {
  originCoords: LatLngPoint;
  destinationCoords: LatLngPoint;
  routePath: LatLngPoint[];
  totalDistanceKm: number;
  totalDurationMin: number;
  step: number;
  totalSteps: number;
  driverName: string;
  driverPlate: string;
  followDriver: boolean;
  onTelemetry?: (t: LiveDriverTelemetry) => void;
}) {
  const map = useMap();
  const [driverMarkerRef, driverMarker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  const approachStart = useMemo(
    () => offsetPointByKm(originCoords, 0.45, 0.35),
    [originCoords]
  );

  const [driverPose, setDriverPose] = useState<{
    position: LatLngPoint;
    heading: number;
  }>({
    position: approachStart,
    heading: 0,
  });

  // Smoothly interpolate driver position every 200ms within current phase
  useEffect(() => {
    const startTime = performance.now();
    const PHASE_DURATION_MS = 2400;

    const updateTick = () => {
      const elapsed = performance.now() - startTime;
      const frac = Math.min(1, elapsed / PHASE_DURATION_MS);

      if (step <= 0) {
        setDriverPose({ position: approachStart, heading: 0 });
        onTelemetry?.({
          position: approachStart,
          heading: 0,
          remainingKm: totalDistanceKm,
          etaMinutes: totalDurationMin,
          phaseLabel: 'Mencari driver terdekat...',
        });
        return;
      }

      if (step === 1) {
        const interp = interpolateAlongPath([approachStart, originCoords], frac);
        if (interp) {
          setDriverPose(interp);
          const remToPickup = haversineKm(interp.position, originCoords);
          onTelemetry?.({
            position: interp.position,
            heading: interp.heading,
            remainingKm: remToPickup,
            etaMinutes: Math.max(1, Math.ceil(remToPickup * 3)),
            phaseLabel: 'Driver menuju titik jemput',
          });
        }
        return;
      }

      if (step === 2) {
        const path =
          routePath.length >= 2 ? routePath : [originCoords, destinationCoords];
        const interp = interpolateAlongPath(path, frac);
        if (interp) {
          setDriverPose(interp);
          const remaining = Math.max(0.1, totalDistanceKm * (1 - frac));
          onTelemetry?.({
            position: interp.position,
            heading: interp.heading,
            remainingKm: remaining,
            etaMinutes: Math.max(1, Math.ceil(totalDurationMin * (1 - frac))),
            phaseLabel: 'Driver dalam perjalanan ke tujuan',
          });
        }
        return;
      }

      // Finished (step >= 3 or step >= totalSteps)
      setDriverPose({ position: destinationCoords, heading: 0 });
      onTelemetry?.({
        position: destinationCoords,
        heading: 0,
        remainingKm: 0,
        etaMinutes: 0,
        phaseLabel: 'Tiba di tujuan',
      });
    };

    updateTick();

    if (step >= 1 && step < totalSteps) {
      const interval = window.setInterval(updateTick, 200);
      return () => window.clearInterval(interval);
    }
  }, [
    step,
    totalSteps,
    approachStart,
    originCoords,
    destinationCoords,
    routePath,
    totalDistanceKm,
    totalDurationMin,
    onTelemetry,
  ]);

  // Smooth camera follow when enabled
  useEffect(() => {
    if (!map || !followDriver || step < 1 || step >= totalSteps) return;
    map.panTo(driverPose.position);
  }, [map, followDriver, driverPose.position, step, totalSteps]);

  if (step <= 0) {
    return (
      <>
        {DRIVER_OFFSET_KM.map(([eastKm, northKm], idx) => (
          <AdvancedMarker
            key={`avail-drv-${idx}`}
            position={offsetPointByKm(originCoords, eastKm, northKm)}
            title="Driver tersedia"
          >
            <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0F9D8A] shadow-md flex items-center justify-center text-[#0B7A6B]">
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </AdvancedMarker>
        ))}
      </>
    );
  }

  return (
    <>
      <AdvancedMarker
        ref={driverMarkerRef}
        position={driverPose.position}
        zIndex={50}
        title={`${driverName} (${driverPlate})`}
        onClick={() => setInfoOpen(true)}
      >
        <div
          className="w-10 h-10 rounded-full bg-[#172124] border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform duration-200"
          style={{ transform: `rotate(${Math.round(driverPose.heading)}deg)` }}
        >
          <Navigation className="w-4 h-4 fill-[#0F9D8A] text-[#0F9D8A]" />
        </div>
      </AdvancedMarker>

      {infoOpen && driverMarker && (
        <InfoWindow
          anchor={driverMarker}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="text-xs text-[#172124] space-y-0.5 pr-1">
            <div className="font-bold">{driverName}</div>
            <div className="text-[#5B676D] font-mono">{driverPlate}</div>
            <div className="text-[#5B676D] font-mono text-[11px]">
              {driverPose.position.lat.toFixed(5)},{' '}
              {driverPose.position.lng.toFixed(5)}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function GoogleRouteMap({
  origin,
  destination,
  travelMode,
  outOfArea = false,
  heightClass = 'h-56 sm:h-72',
  onRouteComputed,
  tracking,
}: GoogleRouteMapProps) {
  const mapsAvailable = useContext(MapsAvailabilityContext);
  const apiStatus = useApiLoadingStatus();
  const [routeStats, setRouteStats] = useState<ComputedRouteStats | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [followDriver, setFollowDriver] = useState<boolean>(false);

  const [originMarkerRef, originMarker] = useAdvancedMarkerRef();
  const [destMarkerRef, destMarker] = useAdvancedMarkerRef();
  const [activeInfo, setActiveInfo] = useState<'origin' | 'dest' | null>(null);

  const handleRouteComputed = useCallback(
    (stats: ComputedRouteStats) => {
      setRouteStats(stats);
      onRouteComputed?.(stats);
    },
    [onRouteComputed]
  );

  // Neutral initial regional center before Places resolves
  const fallbackCenter = origin.coords ??
    destination.coords ?? { lat: -5.0, lng: 120.15 };

  if (
    !mapsAvailable ||
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    const externalUrl = buildGoogleMapsDirectionsUrl(
      origin,
      destination,
      travelMode === 'DRIVING' ? 'driving' : 'two-wheeler'
    );
    return (
      <div
        className={`w-full min-h-[224px] ${heightClass} rounded-2xl border border-[#DCE2E4] bg-[#EDF2F0] flex flex-col items-center justify-center p-5 text-center space-y-2.5`}
      >
        <div className="text-sm font-semibold text-[#172124]">
          {!mapsAvailable
            ? 'Peta interaktif Google Maps belum aktif'
            : 'Peta Google Maps tidak dapat dimuat'}
        </div>
        <p className="text-xs text-[#5B676D] max-w-sm">
          {!mapsAvailable
            ? 'Aktifkan Google Maps Platform pada pengaturan applet atau muat ulang halaman untuk menampilkan peta rute.'
            : 'Periksa koneksi internet atau konfigurasi API key Google Maps Platform.'}
        </p>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-[#DCE2E4] hover:bg-[#FAFDFC] text-xs font-semibold text-[#0B7A6B] inline-flex items-center gap-1.5 transition-colors"
        >
          Lihat rute di Google Maps
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#DFE6E4] bg-[#E8F1EE] relative">
      <div className={`relative w-full min-h-[224px] ${heightClass}`}>
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={fallbackCenter}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <RoutePolylineController
            originCoords={origin.coords}
            destinationCoords={destination.coords}
            travelMode={travelMode}
            outOfArea={outOfArea}
            shouldFitBounds={!followDriver}
            onRouteComputed={handleRouteComputed}
            onRouteError={setRouteError}
          />

          {/* Pickup / Origin Marker */}
          {origin.coords && (
            <>
              <AdvancedMarker
                ref={originMarkerRef}
                position={origin.coords}
                title={`Jemput: ${origin.label}`}
                onClick={() => setActiveInfo('origin')}
              >
                <Pin
                  background="#0F9D8A"
                  borderColor="#0B7A6B"
                  glyphColor="#FFFFFF"
                />
              </AdvancedMarker>
              {activeInfo === 'origin' && originMarker && (
                <InfoWindow
                  anchor={originMarker}
                  onCloseClick={() => setActiveInfo(null)}
                >
                  <div className="text-xs text-[#172124] max-w-[200px]">
                    <div className="font-bold text-[#0B7A6B]">Titik Jemput</div>
                    <div className="font-medium mt-0.5">{origin.label}</div>
                    {origin.address && (
                      <div className="text-[#5B676D] mt-0.5">{origin.address}</div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Destination Marker */}
          {destination.coords && (
            <>
              <AdvancedMarker
                ref={destMarkerRef}
                position={destination.coords}
                title={`Tujuan: ${destination.label}`}
                onClick={() => setActiveInfo('dest')}
              >
                <Pin
                  background="#FF7A1A"
                  borderColor="#C4510A"
                  glyphColor="#FFFFFF"
                />
              </AdvancedMarker>
              {activeInfo === 'dest' && destMarker && (
                <InfoWindow
                  anchor={destMarker}
                  onCloseClick={() => setActiveInfo(null)}
                >
                  <div className="text-xs text-[#172124] max-w-[200px]">
                    <div className="font-bold text-[#C4510A]">Titik Tujuan</div>
                    <div className="font-medium mt-0.5">
                      {destination.label}
                    </div>
                    {destination.address && (
                      <div className="text-[#5B676D] mt-0.5">
                        {destination.address}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Nearby Drivers on Booking Map (non-tracking mode) */}
          {!tracking &&
            !outOfArea &&
            origin.coords &&
            DRIVER_OFFSET_KM.map(([eastKm, northKm], idx) => (
              <AdvancedMarker
                key={`drv-nearby-${idx}`}
                position={offsetPointByKm(origin.coords!, eastKm, northKm)}
                title="Driver aktif di sekitar"
              >
                <div className="w-6 h-6 rounded-full bg-white border-2 border-[#0F9D8A] shadow-sm flex items-center justify-center text-[#0B7A6B]">
                  <Navigation className="w-3 h-3" />
                </div>
              </AdvancedMarker>
            ))}

          {/* Live Tracking Mode Driver Marker */}
          {tracking && origin.coords && destination.coords && (
            <LiveDriverOverlay
              originCoords={origin.coords}
              destinationCoords={destination.coords}
              routePath={routeStats?.path ?? [origin.coords, destination.coords]}
              totalDistanceKm={routeStats?.distanceKm ?? 1.5}
              totalDurationMin={routeStats?.durationMinutes ?? 6}
              step={tracking.step}
              totalSteps={tracking.totalSteps}
              driverName={tracking.driverName}
              driverPlate={tracking.driverPlate}
              followDriver={followDriver}
              onTelemetry={tracking.onTelemetry}
            />
          )}
        </GoogleMap>
      </div>

      {/* Follow Driver Toggle in Tracking Mode */}
      {tracking && tracking.step >= 1 && tracking.step < tracking.totalSteps && (
        <button
          type="button"
          onClick={() => setFollowDriver((prev) => !prev)}
          className={`absolute top-3 right-3 z-10 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm border transition-colors cursor-pointer ${
            followDriver
              ? 'bg-[#0F9D8A] text-white border-[#0B7A6B]'
              : 'bg-white/95 text-[#172124] border-[#DCE2E4] hover:bg-white'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          {followDriver ? 'Mengikuti driver' : 'Pusatkan ke driver'}
        </button>
      )}

      {/* Compact Legend Footer */}
      <div className="bg-white/95 border-t border-[#E4E8EA] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#455257]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D8A]" />
            Jemput
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A1A]" />
            Tujuan
          </span>
          {tracking && tracking.step >= 1 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#172124]" />
              Driver
            </span>
          )}
        </div>
        <span className="text-[#5B676D] font-num">
          {routeError
            ? routeError
            : outOfArea
              ? `Luar radius ${SERVICE_RADIUS_KM} km`
              : routeStats
                ? `${routeStats.distanceKm.toFixed(1)} km · ± ${routeStats.durationMinutes} mnt`
                : 'Memuat rute...'}
        </span>
      </div>
    </div>
  );
}
