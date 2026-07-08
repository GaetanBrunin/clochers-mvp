import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Site } from '../types';
import type { Coords } from '../hooks/useGeolocation';

const numberedIcon = (n: number, done: boolean) =>
  L.divIcon({
    className: 'route-pin-wrap',
    html: `<div class="route-pin ${done ? 'route-pin--done' : ''}">${done ? '✓' : n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const userIcon = L.divIcon({
  className: 'route-pin-wrap',
  html: '<div class="user-pin"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * Carte d'un parcours ordonné : étapes numérotées reliées par un tracé, plus la
 * position de l'utilisateur (mise à jour en direct) et le segment vers la
 * première étape. Rien n'est renvoyé à un serveur : tracé à vol d'oiseau, la
 * navigation détaillée est déléguée à Google Maps depuis la fiche parcours.
 */
export function RouteMap({
  orderedSites,
  coords,
  visitedIds,
  onSelect,
}: {
  orderedSites: Site[];
  coords: Coords | null;
  visitedIds: string[];
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const legRef = useRef<L.Polyline | null>(null); // segment position -> 1re étape
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Clé stable : on ne reconstruit la carte que si l'ordre/état des étapes change.
  const sitesKey = orderedSites.map((s) => `${s.id}:${visitedIds.includes(s.id) ? 1 : 0}`).join('|');

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const latlngs = orderedSites.map((s) => [s.latitude, s.longitude] as [number, number]);

    // Tracé reliant les étapes dans l'ordre.
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: '#7a5a3a', weight: 3, opacity: 0.8 }).addTo(map);
    }

    orderedSites.forEach((s, i) => {
      const marker = L.marker([s.latitude, s.longitude], {
        icon: numberedIcon(i + 1, visitedIds.includes(s.id)),
      }).addTo(map);
      marker.bindPopup(
        `<strong>${i + 1}. ${s.name}</strong><br>${s.city}<br><button class="popup-btn" data-id="${s.id}">Voir la fiche</button>`
      );
      marker.on('popupopen', () => {
        const btn = document.querySelector<HTMLButtonElement>(`.popup-btn[data-id="${s.id}"]`);
        btn?.addEventListener('click', () => onSelectRef.current(s.id), { once: true });
      });
    });

    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30], maxZoom: 15 });
    } else {
      map.setView([50.1754, 3.2362], 11);
    }
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      legRef.current = null;
    };
  }, [sitesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Position utilisateur : mise à jour sans reconstruire la carte.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!coords) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      legRef.current?.remove();
      legRef.current = null;
      return;
    }

    const here: [number, number] = [coords.latitude, coords.longitude];
    if (userMarkerRef.current) userMarkerRef.current.setLatLng(here);
    else userMarkerRef.current = L.marker(here, { icon: userIcon }).addTo(map).bindPopup('Vous êtes ici');

    // Segment en pointillés vers la première étape non visitée.
    const nextSite = orderedSites.find((s) => !visitedIds.includes(s.id));
    if (nextSite) {
      const leg: [number, number][] = [here, [nextSite.latitude, nextSite.longitude]];
      if (legRef.current) legRef.current.setLatLngs(leg);
      else legRef.current = L.polyline(leg, { color: '#2e7d5b', weight: 3, dashArray: '6 8' }).addTo(map);
    }
  }, [coords, sitesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="route-map" />;
}
