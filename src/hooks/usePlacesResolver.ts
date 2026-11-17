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

export function usePresetPlacesResolver() {
  const placesLib = useMapsLibrary('places');
  const [resolvedMap, setResolvedMap] = useState<
    Record<string, ResolvedPlaceCacheEntry>
  >({});
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

  // Always resolve Pasar Palattae center on mount so radius checks work accurately
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

  const serviceCenterCoords = resolvedMap[SERVICE_CENTER_ID]?.coords ?? null;

  return {
    placesReady: Boolean(placesLib),
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
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputString.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
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
          setSuggestions(res.suggestions ?? []);
        }
      } catch (err) {
        if (isQuotaOrAuthError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) {
          setSuggestions([]);
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
    async (
      suggestion: google.maps.places.AutocompleteSuggestion
    ): Promise<SelectedLocation | null> => {
      if (!placesLib || !suggestion.placePrediction) return null;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });
        sessionTokenRef.current = null;
        setSuggestions([]);

        if (!place.location) return null;
        const label =
          place.displayName ||
          suggestion.placePrediction.text?.text ||
          'Lokasi terpilih';
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
        return null;
      }
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
