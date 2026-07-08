// Utilitaires géographiques et liens d'itinéraire (aucune clé API requise).

/** Distance à vol d'oiseau en kilomètres (formule de Haversine). */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Ouvre l'itinéraire Google Maps vers la destination. */
export const googleMapsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/** Itinéraire OpenStreetMap (alternative libre à Google Maps). */
export const osmUrl = (lat: number, lng: number): string =>
  `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`;

/** Lien "geo:" reconnu par Apple Plans / apps natives sur mobile. */
export const geoUrl = (lat: number, lng: number, label: string): string =>
  `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
