import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  UserLocation,
  type PressEventWithFeatures,
  type TrackUserLocation,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
} from 'react-native';

import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { useUserLocation } from '@/hooks/use-user-location';
import { formatDistance } from '@/lib/format';
import { haversineMeters } from '@/lib/geo';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const REGION_DEBOUNCE_MS = 300;

type Pharmacy = Doc<'pharmacies'>;

export default function MapScreen() {
  const router = useRouter();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['28%'], []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { origin, hasLocation } = useUserLocation();
  // Camera follow mode: "default" follows the user; cleared when they pan away.
  const [tracking, setTracking] = useState<TrackUserLocation | undefined>(undefined);
  const [bounds, setBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const [selected, setSelected] = useState<Pharmacy | null>(null);

  // Start following once we have a real fix (not the Abidjan fallback).
  useEffect(() => {
    if (hasLocation) setTracking('default');
  }, [hasLocation]);

  // Priority load: the 20 nearest to the user (or fallback) center.
  const nearest = useQuery(
    api.pharmacies.nearestPharmacies,
    origin ? { lat: origin[1], lng: origin[0], limit: 20 } : 'skip',
  );
  // Progressive fill for the current viewport (debounced on region change).
  const inBounds = useQuery(
    api.pharmacies.pharmaciesInBounds,
    bounds ? bounds : 'skip',
  );

  // Union of both result sets, deduped by id, kept as a lookup for marker taps.
  const pharmacyMap = useMemo(() => {
    const byId = new Map<string, Pharmacy>();
    for (const p of nearest ?? []) byId.set(p._id, p);
    for (const p of inBounds ?? []) if (!byId.has(p._id)) byId.set(p._id, p);
    return byId;
  }, [nearest, inBounds]);
  const pharmacies = useMemo(() => [...pharmacyMap.values()], [pharmacyMap]);

  // Pharmacies as a GeoJSON point layer — rendered natively by MapLibre (reliable
  // on the new architecture and cheap for many points, unlike per-pin Marker views).
  const featureCollection = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: pharmacies.map((p) => ({
        type: 'Feature',
        id: p._id,
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p._id },
      })),
    }),
    [pharmacies],
  );

  const handleSourcePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const id = event.nativeEvent.features?.[0]?.properties?.id as
        | string
        | undefined;
      const pharmacy = id ? pharmacyMap.get(id) : undefined;
      if (pharmacy) {
        setSelected(pharmacy);
        sheetRef.current?.snapToIndex(0);
      }
    },
    [pharmacyMap],
  );

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const [west, south, east, north] = event.nativeEvent.bounds;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setBounds({ minLat: south, maxLat: north, minLng: west, maxLng: east });
      }, REGION_DEBOUNCE_MS);
    },
    [],
  );

  const dismiss = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  if (!origin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const selectedDistance =
    selected && origin
      ? haversineMeters(origin[1], origin[0], selected.lat, selected.lng)
      : null;

  return (
    <View style={styles.container}>
      <MapLibreMap
        style={styles.map}
        mapStyle={STYLE_URL}
        onPress={dismiss}
        onRegionDidChange={handleRegionDidChange}>
        <Camera
          initialViewState={{ center: origin, zoom: 14 }}
          trackUserLocation={tracking}
          onTrackUserLocationChange={(e) =>
            setTracking(e.nativeEvent.trackUserLocation ?? undefined)
          }
        />
        {hasLocation && <UserLocation animated />}
        <GeoJSONSource id="pharmacies" data={featureCollection} onPress={handleSourcePress}>
          <Layer
            id="pharmacy-circles"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': '#208AEF',
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2,
            }}
          />
        </GeoJSONSource>
      </MapLibreMap>

      {hasLocation && !tracking ? (
        <Pressable
          style={styles.recenter}
          onPress={() => setTracking('default')}
          accessibilityLabel="Recenter on my location">
          <Ionicons name="locate" size={22} color="#208AEF" />
        </Pressable>
      ) : null}

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setSelected(null)}>
        <BottomSheetView style={styles.sheet}>
          {selected && (
            <>
              <Text style={styles.name}>{selected.name}</Text>
              <Text style={styles.meta}>
                {[selected.commune, selectedDistance ? formatDistance(selectedDistance) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Pressable
                style={styles.button}
                onPress={() =>
                  router.push({
                    pathname: '/pharmacy/[id]',
                    params: { id: selected._id },
                  })
                }>
                <Text style={styles.buttonText}>View details</Text>
              </Pressable>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },
  recenter: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sheet: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 6 },
  name: { fontSize: 18, fontWeight: '600' },
  meta: { fontSize: 14, color: '#60646C' },
  button: {
    marginTop: 12,
    backgroundColor: '#208AEF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
