import { useCallback, useContext, useState } from 'react';
import { ArrowUpDown, ExternalLink, AlertCircle } from 'lucide-react';
import {
  SERVICE_RADIUS_KM,
  SERVICES,
  buildGoogleMapsDirectionsUrl,
  formatRupiah,
  haversineKm,
  roundUp500,
  type LatLngPoint,
  type SelectedLocation,
} from '../data/jalanKitaData';
import {
  GoogleRouteMap,
  MapsAvailabilityContext,
  type ComputedRouteStats,
} from './GoogleRouteMap';
import { LocationPickerField } from './LocationPickerField';
import { ServiceIcon } from './ServiceIcon';

interface RideViewProps {
  service: 'bike' | 'car';
  from: SelectedLocation;
  to: SelectedLocation;
  serviceCenterCoords: LatLngPoint | null;
  onSelectFromPreset: (presetId: string) => void;
  onSelectToPreset: (presetId: string) => void;
  onSelectFromCustom: (loc: SelectedLocation) => void;
  onSelectToCustom: (loc: SelectedLocation) => void;
  onSwapPlaces: () => void;
  onOrderRide: (fare: number, distanceKm: number, durationMin: number) => void;
  onShowToast: (msg: string) => void;
}

export function RideView({
  service,
  from,
  to,
  serviceCenterCoords,
  onSelectFromPreset,
  onSelectToPreset,
  onSelectFromCustom,
  onSelectToCustom,
  onSwapPlaces,
  onOrderRide,
  onShowToast,
}: RideViewProps) {
  const meta = SERVICES.find((s) => s.id === service)!;
  const mapsAvailable = useContext(MapsAvailabilityContext);
  const [routeStats, setRouteStats] = useState<ComputedRouteStats | null>(null);

  const handleRouteComputed = useCallback((stats: ComputedRouteStats) => {
    setRouteStats(stats);
  }, []);

  const fallbackKm =
    from.coords && to.coords
      ? Math.max(0.8, haversineKm(from.coords, to.coords) * 1.3)
      : 1.4;
  const distKm = routeStats?.distanceKm ?? fallbackKm;
  const etaMinutes =
    routeStats?.durationMinutes ?? Math.ceil(distKm * 3 + 3);

  const baseFare = service === 'bike' ? 3000 : 6000;
  const perKm = service === 'bike' ? 2500 : 4200;
  const fare = roundUp500(baseFare + perKm * distKm);

  const sameLocation =
    from.id === to.id ||
    (Boolean(from.coords && to.coords) &&
      haversineKm(from.coords!, to.coords!) < 0.05);

  const outOfArea =
    (serviceCenterCoords &&
      from.coords &&
      haversineKm(serviceCenterCoords, from.coords) > SERVICE_RADIUS_KM) ||
    (serviceCenterCoords &&
      to.coords &&
      haversineKm(serviceCenterCoords, to.coords) > SERVICE_RADIUS_KM) ||
    from.id === 'pasar-sentral-palakka' ||
    to.id === 'pasar-sentral-palakka';

  const coordsReady = Boolean(from.coords && to.coords);
  const disabled = sameLocation || Boolean(outOfArea) || !coordsReady;

  const mapsUrl = buildGoogleMapsDirectionsUrl(
    from,
    to,
    service === 'car' ? 'driving' : 'two-wheeler'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Live Google Map & Route Pickers */}
      <div className="lg:col-span-7 space-y-4">
        <GoogleRouteMap
          origin={from}
          destination={to}
          travelMode={service === 'car' ? 'DRIVING' : 'TWO_WHEELER'}
          outOfArea={Boolean(outOfArea)}
          heightClass="h-56 sm:h-72"
          onRouteComputed={handleRouteComputed}
        />

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4E8EA] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#172124]">
              Titik Perjalanan
            </h2>
            <button
              type="button"
              onClick={onSwapPlaces}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#F2F5F5] hover:bg-[#E5ECEB] text-xs font-medium text-[#172124] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Tukar lokasi
            </button>
          </div>

          <div className="space-y-4">
            <LocationPickerField
              id="ride-from"
              label="Jemput di"
              value={from}
              biasCenter={serviceCenterCoords}
              onSelectPreset={onSelectFromPreset}
              onSelectCustom={onSelectFromCustom}
              onError={onShowToast}
            />

            <LocationPickerField
              id="ride-to"
              label="Tujuan"
              value={to}
              biasCenter={serviceCenterCoords}
              onSelectPreset={onSelectToPreset}
              onSelectCustom={onSelectToCustom}
              onError={onShowToast}
            />
          </div>
        </div>
      </div>

      {/* Right: Fare Summary & Order CTA */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl ${meta.tintBg} ${meta.tintText} flex items-center justify-center shrink-0`}
              >
                <ServiceIcon id={service} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-[#172124]">
                  {meta.name}
                </div>
                <div className="text-xs sm:text-sm text-[#5B676D] font-num">
                  {!coordsReady
                    ? mapsAvailable
                      ? 'Memuat koordinat Google Maps...'
                      : 'Menunggu aktivasi Google Maps atau pilih Lokasi GPS'
                    : outOfArea
                      ? `Di luar area layanan (radius ${SERVICE_RADIUS_KM} km)`
                      : sameLocation
                        ? 'Pilih tujuan yang berbeda'
                        : `${distKm.toFixed(1)} km · ± ${etaMinutes} menit`}
                </div>
              </div>
            </div>
            <div className="text-xl font-bold font-num text-[#172124] shrink-0">
              {disabled ? '—' : formatRupiah(fare)}
            </div>
          </div>

          {outOfArea && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FDF2F2] border border-[#F5C6C7] text-xs text-[#B4232A]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Salah satu titik berada di luar radius layanan {SERVICE_RADIUS_KM} km dari Pasar Palattae.
              </span>
            </div>
          )}

          {!disabled && (
            <div className="pt-3 border-t border-[#ECEFEF] space-y-1.5 text-xs text-[#5B676D]">
              <div className="flex justify-between">
                <span>Tarif dasar</span>
                <span className="font-num">{formatRupiah(baseFare)}</span>
              </div>
              <div className="flex justify-between">
                <span>Jarak rute Maps ({distKm.toFixed(1)} km)</span>
                <span className="font-num">{formatRupiah(fare - baseFare)}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => onOrderRide(fare, distKm, etaMinutes)}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white text-sm sm:text-base font-semibold transition-all cursor-pointer"
          >
            Pesan {meta.name} · Bayar JK Pay
          </button>

          {!disabled && (
            <div className="space-y-1.5">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E3F5F2] hover:bg-[#D2EFEA] text-[#0B7A6B] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                Buka rute di Google Maps
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-[11px] text-center text-[#6B7780]">
                Terbuka di aplikasi Google Maps
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
