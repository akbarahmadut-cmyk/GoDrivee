import { useContext, useState } from 'react';
import { AdvancedMarker, Map as GoogleMap, Pin } from '@vis.gl/react-google-maps';
import { Crosshair, MapPinOff, Radio } from 'lucide-react';
import { MapsAvailabilityContext } from './GoogleRouteMap';
import { useRealtimeGps } from '../hooks/useRealtimeGps';
import type { LatLngPoint } from '../data/jalanKitaData';

const KAHU_CENTER: LatLngPoint = { lat: -4.7, lng: 120.2 };

interface RoleMapProps {
  label: string;
  pinColor?: string;
}

export function RoleMap({ label, pinColor = '#0F9D8A' }: RoleMapProps) {
  const mapsAvailable = useContext(MapsAvailabilityContext);
  const [liveTrack, setLiveTrack] = useState(true);
  const [position, setPosition] = useState<LatLngPoint | null>(null);
  const gps = useRealtimeGps(liveTrack, (pt) => setPosition(pt));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs bg-[#F5F7F7] px-3 py-2 rounded-xl">
        <span className="inline-flex items-center gap-1.5 font-medium text-[#172124]">
          <Radio className={`w-3.5 h-3.5 ${gps.coords ? 'text-[#0F9D8A] animate-pulse' : 'text-[#6B7780]'}`} />
          {gps.coords
            ? `GPS Live: ${gps.coords.lat.toFixed(5)}, ${gps.coords.lng.toFixed(5)}${
                gps.accuracyMeters ? ` (±${gps.accuracyMeters}m)` : ''
              }`
            : gps.error
              ? gps.error
              : 'Mencari sinyal GPS...'}
        </span>
        <button
          type="button"
          onClick={() => setLiveTrack((v) => !v)}
          className="text-[11px] font-bold text-[#0B7A6B] hover:underline cursor-pointer"
        >
          {liveTrack ? 'Aktif' : 'Nonaktif'}
        </button>
      </div>

      {!mapsAvailable ? (
        <div className="h-44 rounded-xl bg-[#1E2A2E] text-white/80 flex flex-col items-center justify-center gap-1.5 text-xs text-center px-4">
          <MapPinOff className="w-5 h-5 text-[#0F9D8A]" />
          <p className="font-semibold text-white">Koordinat GPS Realtime Aktif</p>
          <p className="text-[11px] text-white/70">
            {position
              ? `Titik saat ini: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
              : 'Izinkan akses lokasi browser untuk membaca titik GPS Anda.'}
          </p>
        </div>
      ) : (
        <div className="relative h-48 rounded-xl overflow-hidden">
          <GoogleMap
            mapId="DEMO_MAP_ID"
            center={position ?? undefined}
            defaultCenter={KAHU_CENTER}
            defaultZoom={position ? 16 : 13}
            gestureHandling="greedy"
            disableDefaultUI={true}
            zoomControl={true}
            style={{ width: '100%', height: '100%' }}
          >
            {position && (
              <AdvancedMarker position={position} title={label}>
                <Pin background={pinColor} borderColor="#0B7A6B" glyphColor="#fff" />
              </AdvancedMarker>
            )}
          </GoogleMap>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setLiveTrack(true);
          gps.requestOnce();
        }}
        className="min-h-[40px] w-full rounded-xl bg-[#E6F6F3] text-[#0B7A6B] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
      >
        <Crosshair className="w-4 h-4" /> {label} (Perbarui GPS)
      </button>
    </div>
  );
}
