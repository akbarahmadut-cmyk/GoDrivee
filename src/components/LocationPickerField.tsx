import { useState } from 'react';
import { LocateFixed, Search, X } from 'lucide-react';
import {
  PRESET_PLACES,
  type LatLngPoint,
  type SelectedLocation,
} from '../data/jalanKitaData';
import { usePlaceAutocomplete } from '../hooks/usePlacesResolver';

interface LocationPickerFieldProps {
  id: string;
  label: string;
  value: SelectedLocation;
  biasCenter: LatLngPoint | null;
  onSelectPreset: (presetId: string) => void;
  onSelectCustom: (loc: SelectedLocation) => void;
  onError?: (message: string) => void;
}

export function LocationPickerField({
  id,
  label,
  value,
  biasCenter,
  onSelectPreset,
  onSelectCustom,
  onError,
}: LocationPickerFieldProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);

  const { suggestions, isLoading, selectSuggestion, clearSuggestions } =
    usePlaceAutocomplete(query, biasCenter);

  const isPreset = PRESET_PLACES.some((p) => p.id === value.id);

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      onError?.('Peramban tidak mendukung akses lokasi GPS.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        onSelectCustom({
          id: `gps-${Date.now()}`,
          label: 'Lokasi Saya (GPS)',
          searchQuery: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
          address: `Koordinat GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          coords,
        });
        setSearchOpen(false);
      },
      () => {
        setLocating(false);
        onError?.('Izin lokasi ditolak atau GPS tidak tersedia.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-[#5B676D]">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={locating}
            onClick={handleUseCurrentGps}
            className="text-xs font-medium text-[#0B7A6B] hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            {locating ? 'Mencari...' : 'Lokasi GPS'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((prev) => !prev);
              setQuery('');
              clearSuggestions();
            }}
            className="text-xs font-medium text-[#0B7A6B] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            {searchOpen ? (
              <>
                <X className="w-3.5 h-3.5" /> Tutup cari
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" /> Cari di Maps
              </>
            )}
          </button>
        </div>
      </div>

      {!searchOpen ? (
        <select
          id={id}
          value={isPreset ? value.id : '__custom__'}
          onChange={(e) => {
            if (e.target.value !== '__custom__') {
              onSelectPreset(e.target.value);
            }
          }}
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DCE2E4] bg-white text-base sm:text-sm text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
        >
          {!isPreset && (
            <option value="__custom__">{value.label}</option>
          )}
          {PRESET_PLACES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative space-y-1.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id={id}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama tempat di Kahu / Bone..."
              className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#0F9D8A] bg-white text-base sm:text-sm text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
            />
          </div>

          {(isLoading || suggestions.length > 0) && (
            <div className="rounded-xl border border-[#DCE2E4] bg-white shadow-md overflow-hidden divide-y divide-[#F0F3F4] max-h-56 overflow-y-auto">
              {isLoading && (
                <div className="px-3.5 py-2.5 text-xs text-[#6B7780]">
                  Mencari lokasi di Google Maps...
                </div>
              )}
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={async () => {
                    const picked = await selectSuggestion(s);
                    if (picked) {
                      onSelectCustom(picked);
                      setSearchOpen(false);
                      setQuery('');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F5F7F7] transition-colors cursor-pointer"
                >
                  <div className="text-sm font-medium text-[#172124] truncate">
                    {s.placePrediction?.mainText?.text ??
                      s.placePrediction?.text.text}
                  </div>
                  {s.placePrediction?.secondaryText?.text && (
                    <div className="text-xs text-[#6B7780] truncate">
                      {s.placePrediction.secondaryText.text}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {value.address && (
        <div className="text-[11px] text-[#6B7780] truncate">
          {value.address}
        </div>
      )}
    </div>
  );
}
