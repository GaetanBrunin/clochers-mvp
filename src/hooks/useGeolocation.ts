import { useCallback, useEffect, useRef, useState } from 'react';

export type Coords = { latitude: number; longitude: number };

type GeoState = {
  coords: Coords | null;
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';
};

/**
 * Géolocalisation à la demande (le navigateur demande la permission au clic).
 * On ne géolocalise jamais automatiquement au chargement.
 *
 * @param watch  si true, suit la position en continu (watchPosition) : utile
 *               pour un parcours guidé où la carte doit suivre l'utilisateur.
 */
export function useGeolocation({ watch = false }: { watch?: boolean } = {}) {
  const [state, setState] = useState<GeoState>({ coords: null, status: 'idle' });
  const watchIdRef = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ coords: null, status: 'unavailable' });
      return;
    }
    setState((s) => ({ ...s, status: 'loading' }));

    const onOk = (pos: GeolocationPosition) =>
      setState({
        coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        status: 'granted',
      });
    const onErr = () => setState({ coords: null, status: 'denied' });
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 };

    if (watch) {
      clearWatch();
      watchIdRef.current = navigator.geolocation.watchPosition(onOk, onErr, opts);
    } else {
      navigator.geolocation.getCurrentPosition(onOk, onErr, opts);
    }
  }, [watch, clearWatch]);

  // Arrête le suivi quand le composant est démonté.
  useEffect(() => clearWatch, [clearWatch]);

  return { ...state, locate, stop: clearWatch };
}
