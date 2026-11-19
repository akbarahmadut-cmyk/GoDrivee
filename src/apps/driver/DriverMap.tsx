import { useContext, useEffect, useRef } from 'react';
import { AdvancedMarker, Map as GoogleMap, Pin, useMap } from '@vis.gl/react-google-maps';
import { Navigation } from 'lucide-react';
import { MapsAvailabilityContext } from '../../components/GoogleRouteMap';
import type { LatLngPoint } from '../../data/jalanKitaData';
import type { DriverJob } from './driverData';

interface DriverMapProps {
  driverPos: LatLngPoint;
  job: DriverJob | null;
  online: boolean;
}

/** Peta penuh layar untuk aplikasi Driver. */
export function DriverMap({ driverPos, job, online }: DriverMapProps) {
  const mapsAvailable = useContext(MapsAvailabilityContext);

  if (!mapsAvailable) return <FallbackMap online={online} hasJob={Boolean(job)} />;

  return (
    <GoogleMap
      mapId="DEMO_MAP_ID"
      defaultCenter={driverPos}
      defaultZoom={15}
      gestureHandling="greedy"
      disableDefaultUI={true}
      style={{ width: '100%', height: '100%' }}
    >
      <FitToJob driverPos={driverPos} job={job} />
      {job && (
        <>
          <RouteLines driverPos={driverPos} job={job} />
          <AdvancedMarker position={job.pickup.coords} title={`Jemput: ${job.pickup.label}`}>
            <Pin background="#0F9D8A" borderColor="#0B7A6B" glyphColor="#fff" />
          </AdvancedMarker>
          <AdvancedMarker position={job.dropoff.coords} title={`Tujuan: ${job.dropoff.label}`}>
            <Pin background="#FF7A1A" borderColor="#C4510A" glyphColor="#fff" />
          </AdvancedMarker>
        </>
      )}
      <AdvancedMarker position={driverPos} zIndex={50} title="Posisi saya">
        <div
          className={`w-11 h-11 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center ${
            online ? 'bg-[#0F9D8A]' : 'bg-[#6B7780]'
          }`}
        >
          <Navigation className="w-5 h-5 text-white fill-white" />
        </div>
      </AdvancedMarker>
    </GoogleMap>
  );
}

function FitToJob({ driverPos, job }: { driverPos: LatLngPoint; job: DriverJob | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (!job) {
      map.panTo(driverPos);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverPos);
    bounds.extend(job.pickup.coords);
    if (job.phase !== 'to_pickup' || true) bounds.extend(job.dropoff.coords);
    map.fitBounds(bounds, { top: 90, bottom: 320, left: 40, right: 40 });
  }, [map, job?.id, job?.phase, driverPos]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Garis bantu: driver → jemput (putus-putus), jemput → tujuan (penuh). */
function RouteLines({ driverPos, job }: { driverPos: LatLngPoint; job: DriverJob }) {
  const map = useMap();
  const linesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;
    linesRef.current.forEach((l) => l.setMap(null));
    const toPickup = new google.maps.Polyline({
      map,
      path: [driverPos, job.pickup.coords],
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#172124', scale: 3 },
          offset: '0',
          repeat: '14px',
        },
      ],
      visible: job.phase === 'to_pickup',
    });
    const toDrop = new google.maps.Polyline({
      map,
      path: [job.pickup.coords, job.dropoff.coords],
      strokeColor: '#0F9D8A',
      strokeOpacity: 0.9,
      strokeWeight: 6,
    });
    linesRef.current = [toPickup, toDrop];
    return () => linesRef.current.forEach((l) => l.setMap(null));
  }, [map, driverPos, job.pickup.coords, job.dropoff.coords, job.phase]);

  return null;
}

/** Latar peta dekoratif saat API key Google Maps belum tersedia. */
function FallbackMap({ online, hasJob }: { online: boolean; hasJob: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#1E2A2E] overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 800">
        <defs>
          <pattern id="blocks" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect width="80" height="80" fill="#22312F" />
            <rect x="6" y="6" width="68" height="68" rx="6" fill="#26383A" />
          </pattern>
        </defs>
        <rect width="400" height="800" fill="url(#blocks)" />
        <path d="M-20 260 C 120 220, 220 340, 420 300" stroke="#3B5150" strokeWidth="22" fill="none" />
        <path d="M150 -20 C 170 200, 110 420, 190 820" stroke="#3B5150" strokeWidth="18" fill="none" />
        <path d="M-20 560 L 420 520" stroke="#34494A" strokeWidth="14" fill="none" />
        {hasJob && (
          <path d="M200 420 C 230 330, 300 300, 320 200" stroke="#0F9D8A" strokeWidth="6" strokeDasharray="10 8" fill="none" />
        )}
      </svg>
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
        <span className={`absolute inset-0 rounded-full ${online ? 'bg-[#0F9D8A]/40 animate-ping' : ''}`} />
        <div className={`relative w-12 h-12 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center ${online ? 'bg-[#0F9D8A]' : 'bg-[#6B7780]'}`}>
          <Navigation className="w-5 h-5 text-white fill-white" />
        </div>
      </div>
    </div>
  );
}
