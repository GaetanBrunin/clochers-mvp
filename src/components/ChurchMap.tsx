import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { Church, PersonalChurchState } from '../types/domain';

const selectedIcon = new L.DivIcon({
  className: 'map-marker selected-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const defaultIcon = new L.DivIcon({
  className: 'map-marker default-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const visitedIcon = new L.DivIcon({
  className: 'map-marker visited-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function FlyToChurch({ church }: { church?: Church }) {
  const map = useMap();

  useEffect(() => {
    if (church) {
      map.flyTo([church.lat, church.lng], 14, { duration: 0.6 });
    }
  }, [church, map]);

  return null;
}

type ChurchMapProps = {
  churches: Church[];
  selectedChurchId: string;
  getChurchState: (churchId: string) => PersonalChurchState;
  onSelectChurch: (churchId: string) => void;
};

export function ChurchMap({ churches, selectedChurchId, getChurchState, onSelectChurch }: ChurchMapProps) {
  const selectedChurch = churches.find((church) => church.id === selectedChurchId) ?? churches[0];

  return (
    <MapContainer center={[50.1746, 3.2344]} zoom={11} scrollWheelZoom={false} zoomControl={false} className="map">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToChurch church={selectedChurch} />
      {churches.map((church) => {
        const state = getChurchState(church.id);
        const icon = church.id === selectedChurchId ? selectedIcon : state.visited ? visitedIcon : defaultIcon;

        return (
          <Marker
            key={church.id}
            position={[church.lat, church.lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectChurch(church.id) }}
          >
            <Popup>
              <strong>{church.name}</strong><br />
              {church.city}<br />
              {state.visited ? 'Déjà visitée' : 'À découvrir'}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
