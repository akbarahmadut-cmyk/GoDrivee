import { useState } from 'react';
import { LocateFixed, MapPin, Search, X } from 'lucide-react';
import {
  PRESET_PLACES,
  offsetPointByKm,
  type LatLngPoint,
  type SelectedLocation,
} from '../data/jalanKitaData';
import {
  LOCAL_PLACES_DIRECTORY,
  usePlaceAutocomplete,
} from '../hooks/usePlacesResolver';

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

  const handlePickManualQuery = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const base = biasCenter ?? { lat: -4.8342, lng: 120.1684 };
    // Buat offset deterministik dari teks agar punya koordinat dan jarak dapat dihitung
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash * 31 + trimmed.charCodeAt(i)) % 1000;
    }
    const eastKm = ((hash % 40) - 20) / 10;
    const northKm = ((Math.floor(hash / 40) % 40) - 20) / 10;
    const coords = offsetPointByKm(base, eastKm, northKm);
    onSelectCustom({
      id: `custom-manual-${Date.now()}`,
      label: trimmed,
      searchQuery: `${trimmed}, Kahu, Kabupaten Bone`,
      address: 'Kahu, Kabupaten Bone, Sulawesi Selatan',
      coords,
    });
    setSearchOpen(false);
    setQuery('');
    clearSuggestions();
  };

  const quickPlaces = LOCAL_PLACES_DIRECTORY.slice(0, 6);

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
                <Search className="w-3.5 h-3.5" /> Cari lokasi
              </>
            )}
          </button>
        </div>
      </div>

      {!searchOpen ? (
        <button
          id={id}
          type="button"
          onClick={() => {
            setSearchOpen(true);
            setQuery('');
            clearSuggestions();
          }}
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DCE2E4] bg-white text-left text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A] cursor-pointer"
        >
          {isPreset ? (
            <span className="text-[#6B7780]">Ketik atau pilih lokasi...</span>
          ) : (
            <span className="text-[#172124] font-medium">{value.label}</span>
          )}
        </button>
      ) : (
        <div className="relative space-y-1.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id={id}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePickManualQuery();
                }
              }}
              placeholder="Ketik nama tempat / alamat di Kahu, Bone..."
              className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#0F9D8A] bg-white text-base sm:text-sm text-[#172124] focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]"
            />
          </div>

          <div className="rounded-xl border border-[#DCE2E4] bg-white shadow-md overflow-hidden divide-y divide-[#F0F3F4] max-h-60 overflow-y-auto">
            {isLoading && (
              <div className="px-3.5 py-2 text-xs text-[#6B7780]">
                Mencari lokasi...
              </div>
            )}

            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={handlePickManualQuery}
                className="w-full px-3.5 py-2.5 text-left bg-[#E6F6F3]/60 hover:bg-[#E6F6F3] transition-colors cursor-pointer flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#0B7A6B] shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0B7A6B] truncate">
                    Gunakan "{query.trim()}"
                  </div>
                  <div className="text-[11px] text-[#5B676D]">
                    Pakai alamat ini sebagai titik lokasi
                  </div>
                </div>
              </button>
            )}

            {(query.trim().length > 0 ? suggestions : quickPlaces.map((p) => ({
              id: p.id,
              mainText: p.label,
              secondaryText: p.address,
              coords: p.coords,
            }))).map((s) => (
              <button
                key={s.id}
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
                  {s.mainText}
                </div>
                {s.secondaryText && (
                  <div className="text-xs text-[#6B7780] truncate">
                    {s.secondaryText}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isPreset && value.address && (
        <div className="text-[11px] text-[#6B7780] truncate">
          {value.address}
        </div>
      )}
    </div>
  );
}
