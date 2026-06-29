import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { ABIDJAN_CENTER } from '@/lib/geo';

export type UserLocation = {
  /** [lng, lat] — null while resolving, then the user's position or the fallback. */
  origin: [number, number] | null;
  /** True only when a real device fix was obtained (drives the blue dot). */
  hasLocation: boolean;
};

// Foreground location with an Abidjan fallback. Seeds quickly from the last
// known fix, then subscribes to live updates so `origin` follows the user as
// they move (throttled to meaningful movement). Never blocks forever: a 5s
// timeout guarantees `origin` resolves even if the GPS fix is slow or denied.
export function useUserLocation(): UserLocation {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    const fallback = () => {
      if (!cancelled) setOrigin((current) => current ?? ABIDJAN_CENTER);
    };
    const timer = setTimeout(fallback, 5000);
    const apply = (pos: Location.LocationObject) => {
      if (cancelled) return;
      clearTimeout(timer);
      setOrigin([pos.coords.longitude, pos.coords.latitude]);
      setHasLocation(true);
    };
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          clearTimeout(timer);
          fallback();
          return;
        }
        // Instant seed from the OS's cached fix, if any.
        const last = await Location.getLastKnownPositionAsync();
        if (last) apply(last);
        // Live updates: GPS-accurate for the moving map dot, throttled to at
        // most every 4s / every 25 m of movement.
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,
            distanceInterval: 25,
          },
          apply,
        );
      } catch {
        clearTimeout(timer);
        fallback();
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription?.remove();
    };
  }, []);

  return { origin, hasLocation };
}
