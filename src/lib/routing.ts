import { haversineKm } from './geo';

type LatLng = { latitude: number; longitude: number };

/**
 * Ordonne des lieux pour construire un vrai parcours à pied depuis la position
 * de départ : algorithme du plus proche voisin (on va au lieu le plus proche,
 * puis au plus proche depuis là, etc.). Simple, déterministe, sans API externe.
 */
export function orderByProximity<T extends LatLng>(items: T[], from: LatLng): T[] {
  const remaining = [...items];
  const ordered: T[] = [];
  let current: LatLng = from;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }
  return ordered;
}

/** Longueur cumulée (km) d'un itinéraire, position de départ optionnelle incluse. */
export function totalPathKm(from: LatLng | null, stops: LatLng[]): number {
  const points = from ? [from, ...stops] : stops;
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
  return km;
}

/**
 * Lien Google Maps « itinéraire » multi-étapes (à pied), pour la navigation
 * réelle turn-by-turn. Gratuit, sans clé. L'origine est la position de départ
 * (sinon Google la déduit de l'appareil).
 */
export function gmapsRouteUrl(origin: LatLng | null, stops: LatLng[]): string {
  if (stops.length === 0) return 'https://www.google.com/maps';
  const dest = stops[stops.length - 1];
  const params = new URLSearchParams();
  params.set('api', '1');
  if (origin) params.set('origin', `${origin.latitude},${origin.longitude}`);
  params.set('destination', `${dest.latitude},${dest.longitude}`);
  const waypoints = stops.slice(0, -1).map((s) => `${s.latitude},${s.longitude}`).join('|');
  if (waypoints) params.set('waypoints', waypoints);
  params.set('travelmode', 'walking');
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
