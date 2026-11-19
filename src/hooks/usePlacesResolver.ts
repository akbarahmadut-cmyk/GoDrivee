import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  PRESET_PLACES,
  SERVICE_CENTER_ID,
  isQuotaOrAuthError,
  type LatLngPoint,
  type SelectedLocation,
} from '../data/jalanKitaData';

export interface ResolvedPlaceCacheEntry {
  coords: LatLngPoint;
  formattedAddress?: string;
}

export interface PlaceSuggestionItem {
  id: string;
  mainText: string;
  secondaryText?: string;
  coords?: LatLngPoint;
  googleSuggestion?: google.maps.places.AutocompleteSuggestion;
}

// Koordinat nyata lokasi-lokasi di Kahu & Kabupaten Bone agar perhitungan jarak,
// ongkos, dan pencarian tetap berfungsi penuh tanpa API key berbayar.
export const LOCAL_PLACES_DIRECTORY: {
  id: string;
  label: string;
  address: string;
  coords: LatLngPoint;
}[] = [
  {
    id: 'pasar-palattae',
    label: 'Pasar Palattae',
    address: 'Palattae, Kec. Kahu, Kabupaten Bone, Sulawesi Selatan',
    coords: { lat: -4.8342, lng: 120.1684 },
  },
  {
    id: 'kantor-camat-kahu',
    label: 'Kantor Camat Kahu',
    address: 'Jl. Poros Palattae, Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8365, lng: 120.1712 },
  },
  {
    id: 'puskesmas-kahu',
    label: 'Puskesmas Kahu',
    address: 'Palattae, Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8321, lng: 120.1658 },
  },
  {
    id: 'sman-1-kahu',
    label: 'SMA Negeri 1 Kahu',
    address: 'Jl. Pendidikan Palattae, Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8398, lng: 120.1745 },
  },
  {
    id: 'rm-pesona-kampung',
    label: 'RM Pesona Kampung',
    address: 'Palattae, Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8351, lng: 120.1695 },
  },
  {
    id: 'masjid-raya-palattae',
    label: 'Masjid Raya Palattae',
    address: 'Pusat Kota Palattae, Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8348, lng: 120.1679 },
  },
  {
    id: 'lapangan-palattae',
    label: 'Lapangan Merdeka Palattae',
    address: 'Palattae, Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8359, lng: 120.1671 },
  },
  {
    id: 'desa-cenrana-kahu',
    label: 'Desa Cenrana Kahu',
    address: 'Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8215, lng: 120.1582 },
  },
  {
    id: 'desa-biru-kahu',
    label: 'Desa Biru Kahu',
    address: 'Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.8475, lng: 120.1823 },
  },
  {
    id: 'desa-pasaka-kahu',
    label: 'Desa Pasaka Kahu',
    address: 'Kec. Kahu, Kabupaten Bone',
    coords: { lat: -4.853, lng: 120.161 },
  },
  {
    id: 'pasar-sentral-palakka',
    label: 'Pasar Sentral Palakka (luar area)',
    address: 'Watampone, Kabupaten Bone, Sulawesi Selatan',
    coords: { lat: -4.5386, lng: 120.305 },
  },
];

const INITIAL_RESOLVED_CACHE: Record<string, ResolvedPlaceCacheEntry> =
  Object.fromEntries(
    LOCAL_PLACES_DIRECTORY.map((p) => [
      p.id,
      { coords: p.coords, formattedAddress: p.address },
    ])
  );

export function usePresetPlacesResolver() {
  const placesLib = useMapsLibrary('places');
  const [resolvedMap, setResolvedMap] = useState<
    Record<string, ResolvedPlaceCacheEntry>
  >(INITIAL_RESOLVED_CACHE);
  const inFlightRef = useRef<Record<string, boolean>>({});
  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({});

  const resolvePresetById = useCallback(
    async (presetId: string) => {
      if (!placesLib || resolvedMap[presetId] || inFlightRef.current[presetId]) {
        return;
      }
      const preset = PRESET_PLACES.find((p) => p.id === presetId);
      if (!preset) return;

      inFlightRef.current[presetId] = true;
      setResolvingIds((prev) => ({ ...prev, [presetId]: true }));

      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: preset.searchQuery,
          fields: ['location', 'formattedAddress', 'displayName'],
          region: 'ID',
          language: 'id',
          maxResultCount: 1,
        });

        const top = places?.[0];
        if (top?.location) {
          setResolvedMap((prev) => ({
            ...prev,
            [presetId]: {
              coords: {
                lat: top.location!.lat(),
                lng: top.location!.lng(),
              },
              formattedAddress: top.formattedAddress ?? undefined,
            },
          }));
        }
      } catch (err) {
        if (isQuotaOrAuthError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } finally {
        inFlightRef.current[presetId] = false;
        setResolvingIds((prev) => ({ ...prev, [presetId]: false }));
      }
    },
    [placesLib, resolvedMap]
  );

  useEffect(() => {
    if (!placesLib) return;
    void resolvePresetById(SERVICE_CENTER_ID);
  }, [placesLib, resolvePresetById]);

  const getPresetLocation = useCallback(
    (presetId: string): SelectedLocation => {
      const preset =
        PRESET_PLACES.find((p) => p.id === presetId) ?? PRESET_PLACES[0];
      const cached = resolvedMap[preset.id];
      return {
        id: preset.id,
        label: preset.label,
        searchQuery: preset.searchQuery,
        address: cached?.formattedAddress,
        coords: cached?.coords ?? null,
      };
    },
    [resolvedMap]
  );

  const serviceCenterCoords =
    resolvedMap[SERVICE_CENTER_ID]?.coords ?? { lat: -4.8342, lng: 120.1684 };

  return {
    placesReady: true,
    resolvedMap,
    resolvingIds,
    resolvePresetById,
    getPresetLocation,
    serviceCenterCoords,
  };
}

export function usePlaceAutocomplete(
  inputString: string,
  biasCenter: LatLngPoint | null
) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = inputString.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // 1. Filter direktori lokal Kahu/Bone secara instan
    const qLower = trimmed.toLowerCase();
    const localMatches: PlaceSuggestionItem[] = LOCAL_PLACES_DIRECTORY.filter(
      (p) =>
        p.label.toLowerCase().includes(qLower) ||
        p.address.toLowerCase().includes(qLower)
    ).map((p) => ({
      id: p.id,
      mainText: p.label,
      secondaryText: p.address,
      coords: p.coords,
    }));

    setSuggestions(localMatches);

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        // 2. Jika Google Places tersedia, gunakan Google Places Autocomplete
        if (placesLib) {
          const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new AutocompleteSessionToken();
          }
          const request: google.maps.places.AutocompleteRequest = {
            input: trimmed,
            sessionToken: sessionTokenRef.current!,
            includedRegionCodes: ['id'],
            language: 'id',
            ...(biasCenter
              ? {
                  locationBias: {
                    center: biasCenter,
                    radius: 40000,
                  },
                }
              : {}),
          };
          const res =
            await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          if (!cancelled) {
            const gItems: PlaceSuggestionItem[] = (res.suggestions ?? []).map(
              (s, idx) => ({
                id: `g-${idx}`,
                mainText:
                  s.placePrediction?.mainText?.text ??
                  s.placePrediction?.text?.text ??
                  trimmed,
                secondaryText: s.placePrediction?.secondaryText?.text,
                googleSuggestion: s,
              })
            );
            setSuggestions(gItems.length > 0 ? gItems : localMatches);
          }
          return;
        }

        // 3. Fallback ke OpenStreetMap Nominatim (gratis tanpa API key)
        if (trimmed.length >= 2) {
          const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=6&accept-language=id&q=${encodeURIComponent(
            trimmed.toLowerCase().includes('bone') ||
              trimmed.toLowerCase().includes('kahu')
              ? trimmed
              : `${trimmed}, Bone, Sulawesi Selatan`
          )}`;
          const resp = await fetch(url);
          if (resp.ok) {
            const data = (await resp.json()) as {
              place_id: number;
              display_name: string;
              lat: string;
              lon: string;
            }[];
            if (!cancelled && Array.isArray(data) && data.length > 0) {
              const osmItems: PlaceSuggestionItem[] = data.map((item) => {
                const parts = item.display_name.split(',');
                return {
                  id: `osm-${item.place_id}`,
                  mainText: parts[0]?.trim() || item.display_name,
                  secondaryText: parts.slice(1).join(',').trim(),
                  coords: {
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                  },
                };
              });
              const merged = [...localMatches];
              osmItems.forEach((o) => {
                if (
                  !merged.some(
                    (m) => m.mainText.toLowerCase() === o.mainText.toLowerCase()
                  )
                ) {
                  merged.push(o);
                }
              });
              setSuggestions(merged);
            }
          }
        }
      } catch (err) {
        if (isQuotaOrAuthError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputString, biasCenter]);

  const selectSuggestion = useCallback(
    async (item: PlaceSuggestionItem): Promise<SelectedLocation | null> => {
      if (item.googleSuggestion && placesLib && item.googleSuggestion.placePrediction) {
        try {
          const place = item.googleSuggestion.placePrediction.toPlace();
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'location'],
          });
          sessionTokenRef.current = null;
          setSuggestions([]);

          if (!place.location) return null;
          const label = place.displayName || item.mainText || 'Lokasi terpilih';
          return {
            id: `custom-${place.id ?? Date.now()}`,
            label,
            searchQuery: place.formattedAddress || label,
            address: place.formattedAddress ?? undefined,
            coords: {
              lat: place.location.lat(),
              lng: place.location.lng(),
            },
          };
        } catch (err) {
          if (isQuotaOrAuthError(err)) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
        }
      }

      if (item.coords) {
        setSuggestions([]);
        return {
          id: `custom-${item.id}-${Date.now()}`,
          label: item.mainText,
          searchQuery: item.secondaryText
            ? `${item.mainText}, ${item.secondaryText}`
            : item.mainText,
          address: item.secondaryText,
          coords: item.coords,
        };
      }

      return null;
    },
    [placesLib]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    selectSuggestion,
    clearSuggestions,
  };
}
