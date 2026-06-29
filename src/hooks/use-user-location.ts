import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { ABIDJAN_CENTER } from '@/lib/geo';

export type UserLocation = {
  /** [lng, lat] — null while resolving, then the user's position or the fallback. */
  origin: [number, number] | null;
  /** True only when a real device fix was obtained (drives the blue dot). */
  hasLocation: boolean;
};

// Foreground location with an Abidjan fallback. Never blocks forever: a 5s
// timeout guarantees `origin` resolves even if the GPS fix is slow or denied.
export function useUserLocation(): UserLocation {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fallback = () => {
      if (!cancelled) setOrigin((current) => current ?? ABIDJAN_CENTER);
    };
    const timer = setTimeout(fallback, 5000);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos =
            (await Location.getLastKnownPositionAsync()) ??
            (await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }));
          if (!cancelled && pos) {
            clearTimeout(timer);
            setOrigin([pos.coords.longitude, pos.coords.latitude]);
            setHasLocation(true);
            return;
          }
        }
      } catch {
        // fall through to the fallback center
      }
      clearTimeout(timer);
      fallback();
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { origin, hasLocation };
}
