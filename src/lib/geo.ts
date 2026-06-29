// Abidjan city center, [lng, lat] (MapLibre order). Fallback when location is
// denied or slow — keeps the map/list from ever being blank.
export const ABIDJAN_CENTER: [number, number] = [-4.0083, 5.3599];

// Great-circle distance in metres between two [lat, lng] points. Display/sort
// helper on the client; the server has its own copy for the nearby query.
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
