import { useCallback, useContext, useState } from 'react';
import { AlertCircle, ExternalLink, Package } from 'lucide-react';
import {
  SERVICE_RADIUS_KM,
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

export interface PickupDraft {
  fromId: string;
  toId: string;
  customFrom?: SelectedLocation;
  customTo?: SelectedLocation;
  item: string;
  weight: '<1 kg' | '1–5 kg' | '5–10 kg';
  note: string;
}

interface PickupViewProps {
  draft: PickupDraft;
  fromLocation: SelectedLocation;
  toLocation: SelectedLocation;
  serviceCenterCoords: LatLngPoint | null;
  onChangeDraft: (next: PickupDraft) => void;
  onOrderPickup: (fare: number, distanceKm: number, durationMin: number) => void;
  onShowToast: (msg: string) => void;
}

const ITEM_TYPES = ['Dokumen', 'Paket', 'Makanan', 'Elektronik', 'Pakaian'];
const WEIGHT_TIERS: { label: PickupDraft['weight']; surcharge: number }[] = [
  { label: '<1 kg', surcharge: 0 },
  { label: '1–5 kg', surcharge: 4000 },
  { label: '5–10 kg', surcharge: 9000 },
];

export function PickupView({
  draft,
  fromLocation,
  toLocation,
  serviceCenterCoords,
  onChangeDraft,
  onOrderPickup,
  onShowToast,
}: PickupViewProps) {
  const mapsAvailable = useContext(MapsAvailabilityContext);
  const [routeStats, setRouteStats] = useState<ComputedRouteStats | null>(null);

  const handleRouteComputed = useCallback((stats: ComputedRouteStats) => {
    setRouteStats(stats);
  }, []);

  const fallbackKm =
    fromLocation.coords && toLocation.coords
      ? Math.max(0.8, haversineKm(fromLocation.coords, toLocation.coords) * 1.3)
      : 1.4;
  const distKm = routeStats?.distanceKm ?? fallbackKm;
  const durationMin =
    routeStats?.durationMinutes ?? Math.ceil(distKm * 3 + 3);

  const weightSurcharge =
    WEIGHT_TIERS.find((w) => w.label === draft.weight)?.surcharge ?? 0;
  const fare = roundUp500(7000 + 3000 * distKm + weightSurcharge);

  const sameLocation =
    fromLocation.id === toLocation.id ||
    (Boolean(fromLocation.coords && toLocation.coords) &&
      haversineKm(fromLocation.coords!, toLocation.coords!) < 0.05);

  const outOfArea =
    (serviceCenterCoords &&
      fromLocation.coords &&
      haversineKm(serviceCenterCoords, fromLocation.coords) > SERVICE_RADIUS_KM) ||
    (serviceCenterCoords &&
      toLocation.coords &&
      haversineKm(serviceCenterCoords, toLocation.coords) > SERVICE_RADIUS_KM) ||
    fromLocation.id === 'pasar-sentral-palakka' ||
    toLocation.id === 'pasar-sentral-palakka';

  const coordsReady = Boolean(fromLocation.coords && toLocation.coords);
  const disabled = sameLocation || Boolean(outOfArea) || !coordsReady;

  const mapsUrl = buildGoogleMapsDirectionsUrl(
    fromLocation,
    toLocation,
    'two-wheeler'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-4">
        <GoogleRouteMap
          origin={fromLocation}
          destination={toLocation}
          travelMode="TWO_WHEELER"
          outOfArea={Boolean(outOfArea)}
          heightClass="h-52 sm:h-64"
          onRouteComputed={handleRouteComputed}
        />

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4E8EA] space-y-4">
          <p className="text-sm text-[#5B676D]">
            Kirim atau jemput barang dalam kecamatan — dokumen, paket, atau titipan warga.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <LocationPickerField
              id="pk-from"
              label="Jemput barang di"
              value={fromLocation}
              biasCenter={serviceCenterCoords}
              onSelectPreset={(presetId) =>
                onChangeDraft({
                  ...draft,
                  fromId: presetId,
                  customFrom: undefined,
                })
              }
              onSelectCustom={(loc) =>
                onChangeDraft({
                  ...draft,
                  fromId: loc.id,
                  customFrom: loc,
                })
              }
              onError={onShowToast}
            />

            <LocationPickerField
              id="pk-to"
              label="Antar ke"
              value={toLocation}
              biasCenter={serviceCenterCoords}
              onSelectPreset={(presetId) =>
                onChangeDraft({
                  ...draft,
                  toId: presetId,
                  customTo: undefined,
                })
              }
              onSelectCustom={(loc) =>
                onChangeDraft({
                  ...draft,
                  toId: loc.id,
                  customTo: loc,
                })
              }
              onError={onShowToast}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="pk-item"
                className="block text-xs font-medium text-[#5B676D] mb-1.5"
              >
                Jenis barang
              </label>
              <select
                id="pk-item"
                value={draft.item}
                onChange={(e) =>
                  onChangeDraft({ ...draft, item: e.target.value })
                }
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DCE2E4] bg-white text-sm text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pk-weight"
                className="block text-xs font-medium text-[#5B676D] mb-1.5"
              >
                Perkiraan berat
              </label>
              <select
                id="pk-weight"
                value={draft.weight}
                onChange={(e) =>
                  onChangeDraft({
                    ...draft,
                    weight: e.target.value as PickupDraft['weight'],
                  })
                }
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DCE2E4] bg-white text-sm text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
              >
                {WEIGHT_TIERS.map((w) => (
                  <option key={w.label} value={w.label}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="pk-note"
              className="block text-xs font-medium text-[#5B676D] mb-1.5"
            >
              Catatan untuk driver
            </label>
            <textarea
              id="pk-note"
              rows={2}
              value={draft.note}
              onChange={(e) =>
                onChangeDraft({ ...draft, note: e.target.value })
              }
              placeholder="Contoh: titip ke satpam atau hubungi penerima saat tiba"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE2E4] bg-white text-sm text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
            />
          </div>
        </div>
      </div>

      {/* Right: Fare & Submit */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E4E8EA] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF4DC] text-[#9A6700] flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-[#172124]">
                  Estimasi biaya
                </div>
                <div className="text-xs sm:text-sm text-[#5B676D] font-num">
                  {!coordsReady
                    ? mapsAvailable
                      ? 'Memuat koordinat Google Maps...'
                      : 'Menunggu aktivasi Google Maps atau pilih Lokasi GPS'
                    : outOfArea
                      ? `Di luar area layanan (radius ${SERVICE_RADIUS_KM} km)`
                      : sameLocation
                        ? 'Pilih lokasi berbeda'
                        : `${distKm.toFixed(1)} km · ${draft.item} (${draft.weight})`}
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
                Titik jemput atau pengantaran berada di luar radius {SERVICE_RADIUS_KM} km.
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => onOrderPickup(fare, distKm, durationMin)}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0B7A6B] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white text-sm sm:text-base font-semibold transition-all cursor-pointer"
          >
            Pesan Go Pick up · Bayar JK Pay
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
