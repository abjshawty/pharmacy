// Adaptive distance: metres below 1 km, one-decimal km above (PLAN.md).
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;

// Phone numbers are stored raw as scraped. Strip spaces and prepend the Côte
// d'Ivoire country code for a `tel:` URI (idempotent if already prefixed).
export const toDialable = (phone: string): string => {
  const compact = phone.replace(/\s+/g, "");
  return compact.startsWith("+") ? compact : `+225${compact}`;
};
