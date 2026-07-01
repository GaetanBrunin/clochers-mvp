import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CATEGORY_META, type Site } from '../types';

// Icône de marqueur basée sur le pictogramme de la catégorie (aucun asset
// externe : on évite le bug classique des icônes Leaflet cassées par le bundler).
const iconFor = (emoji: string) =>
  L.divIcon({
    className: 'map-pin',
    html: `<div class="map-pin__dot">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });

/**
 * Carte interactive OpenStreetMap via Leaflet (gratuit, sans clé API).
 * Chaque site est un marqueur cliquable qui ouvre sa fiche.
 */
export function MapView({ sites, onSelect }: { sites: Site[]; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    sites.forEach((s) => {
      const marker = L.marker([s.latitude, s.longitude], {
        icon: iconFor(CATEGORY_META[s.category].emoji),
      }).addTo(map);
      marker.bindPopup(
        `<strong>${s.name}</strong><br>${CATEGORY_META[s.category].label} · ${s.city}<br><button class="popup-btn" data-id="${s.id}">Voir la fiche</button>`
      );
      marker.on('popupopen', () => {
        const btn = document.querySelector<HTMLButtonElement>(`.popup-btn[data-id="${s.id}"]`);
        btn?.addEventListener('click', () => onSelectRef.current(s.id), { once: true });
      });
      bounds.extend([s.latitude, s.longitude]);
    });

    if (sites.length > 0) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    else map.setView([50.1754, 3.2362], 10); // Cambrai par défaut

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [sites]);

  return <div ref={containerRef} className="map" />;
}
