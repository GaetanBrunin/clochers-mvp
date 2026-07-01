import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_META, type Site, type VisitRoute } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import { useGeolocation } from '../hooks/useGeolocation';
import { RouteMap } from './RouteMap';
import { RouteComplete } from './RouteComplete';
import { formatDistance, googleMapsUrl, haversineKm } from '../lib/geo';
import { gmapsRouteUrl, orderByProximity, totalPathKm } from '../lib/routing';

/** Onglet Parcours : rejoindre un parcours, le suivre en mode guidé (tri par
 *  proximité, carte, position en direct, directions vers l'étape suivante). */
export function RoutesView({
  routes,
  sites,
  api,
  onSelect,
}: {
  routes: VisitRoute[];
  sites: Site[];
  api: ProgressApi;
  onSelect: (id: string) => void;
}) {
  const byId = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);
  const geo = useGeolocation({ watch: true });
  const activeId = api.progress.activeRouteId;
  const active = routes.find((r) => r.id === activeId) ?? null;

  // Ordre des étapes du parcours actif, figé jusqu'à un recalcul explicite pour
  // éviter que les numéros ne changent à chaque battement GPS.
  const [orderIds, setOrderIds] = useState<string[] | null>(null);

  const activeSites = useMemo(
    () => (active ? active.siteIds.map((id) => byId.get(id)).filter(Boolean) as Site[] : []),
    [active, byId]
  );

  // Réinitialise l'ordre quand on change de parcours.
  useEffect(() => setOrderIds(null), [activeId]);

  // Calcule l'ordre dès qu'on a une position (si pas encore fait).
  useEffect(() => {
    if (active && geo.coords && orderIds === null) {
      setOrderIds(orderByProximity(activeSites, geo.coords).map((s) => s.id));
    }
  }, [active, geo.coords, orderIds, activeSites]);

  const orderedSites: Site[] = orderIds
    ? (orderIds.map((id) => byId.get(id)).filter(Boolean) as Site[])
    : activeSites;

  const recompute = () => {
    if (geo.coords) setOrderIds(orderByProximity(activeSites, geo.coords).map((s) => s.id));
    else geo.locate();
  };

  return (
    <div className="routes">
      {active && (
        <ActiveRoute
          route={active}
          orderedSites={orderedSites}
          api={api}
          coords={geo.coords}
          geoStatus={geo.status}
          onLocate={geo.locate}
          onRecompute={recompute}
          onSelect={onSelect}
        />
      )}

      {routes
        .filter((r) => r.id !== activeId)
        .map((r) => {
          const done = r.siteIds.filter((id) => api.isVisited(id)).length;
          const pct = Math.round((done / r.siteIds.length) * 100);
          return (
            <section key={r.id} className="route-card">
              <div className="route-card__head">
                <h3>{r.title}</h3>
                <span className="pill pill--neutral">{r.difficulty === 'easy' ? 'Facile' : 'Moyen'}</span>
              </div>
              <p className="muted">{r.description}</p>
              <p className="muted">
                {r.duration} · {r.distance} · {r.siteIds.length} étapes
              </p>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="muted">
                {done}/{r.siteIds.length} déjà visité(s)
              </p>
              <button className="btn" onClick={() => api.toggleActiveRoute(r.id)}>
                Rejoindre ce parcours
              </button>
            </section>
          );
        })}
    </div>
  );
}

function ActiveRoute({
  route,
  orderedSites,
  api,
  coords,
  geoStatus,
  onLocate,
  onRecompute,
  onSelect,
}: {
  route: VisitRoute;
  orderedSites: Site[];
  api: ProgressApi;
  coords: { latitude: number; longitude: number } | null;
  geoStatus: string;
  onLocate: () => void;
  onRecompute: () => void;
  onSelect: (id: string) => void;
}) {
  const done = orderedSites.filter((s) => api.isVisited(s.id)).length;
  const pct = orderedSites.length ? Math.round((done / orderedSites.length) * 100) : 0;
  const next = orderedSites.find((s) => !api.isVisited(s.id)) ?? null;
  const remaining = orderedSites.filter((s) => !api.isVisited(s.id));
  const pathKm = totalPathKm(coords, orderedSites);

  // Animation de fin : déclenchée quand le parcours passe à 100 %.
  const complete = orderedSites.length > 0 && done === orderedSites.length;
  const [celebrate, setCelebrate] = useState(false);
  const wasComplete = useRef(false);
  useEffect(() => {
    if (complete && !wasComplete.current) setCelebrate(true);
    wasComplete.current = complete;
  }, [complete]);

  return (
    <section className="route-card route-card--active">
      <div className="route-card__head">
        <h3>🧭 {route.title}</h3>
        <span className="pill pill--open">En cours</span>
      </div>

      <div className="progress-bar progress-bar--lg">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted">
        {done}/{orderedSites.length} étape(s) — ~{pathKm.toFixed(1)} km au total
      </p>

      {geoStatus !== 'granted' ? (
        <div className="locate-cta">
          <p className="muted">
            Active ta position pour trier les étapes autour de toi et suivre le parcours sur la
            carte.
          </p>
          <button className="btn" onClick={onLocate}>
            {geoStatus === 'loading' ? 'Localisation…' : '📍 Activer ma position'}
          </button>
          {geoStatus === 'denied' && <p className="muted">Localisation refusée par le navigateur.</p>}
        </div>
      ) : (
        <button className="btn btn--ghost" onClick={onRecompute}>
          ↻ Recalculer l’ordre depuis ma position
        </button>
      )}

      <RouteMap
        orderedSites={orderedSites}
        coords={coords}
        visitedIds={api.progress.visitedIds}
        onSelect={onSelect}
      />

      {next ? (
        <div className="next-step">
          <span className="next-step__label">Prochaine étape</span>
          <h4>{CATEGORY_META[next.category].emoji} {next.name}</h4>
          <p className="muted">
            {next.city}
            {coords && ` · ${formatDistance(haversineKm(coords, next))}`}
          </p>
          <div className="detail__actions">
            <a className="btn" href={googleMapsUrl(next.latitude, next.longitude)} target="_blank" rel="noreferrer">
              🧭 M’y guider
            </a>
            <button className="btn btn--ghost" onClick={() => onSelect(next.id)}>
              Voir la fiche
            </button>
            <button className="chip chip--on" onClick={() => api.toggleVisited(next.id)}>
              ✓ Étape faite
            </button>
          </div>
        </div>
      ) : (
        <div className="route-done">
          <p>🎉 Parcours terminé, bravo !</p>
          <button className="btn btn--ghost" onClick={() => setCelebrate(true)}>
            Revoir l’animation
          </button>
        </div>
      )}

      <ol className="route-steps route-steps--numbered">
        {orderedSites.map((s, i) => {
          const visited = api.isVisited(s.id);
          return (
            <li key={s.id}>
              <button className="route-step" onClick={() => onSelect(s.id)}>
                <span className={visited ? 'step-num step-num--done' : 'step-num'}>
                  {visited ? '✓' : i + 1}
                </span>
                <span className={visited ? 'step-name step-name--done' : 'step-name'}>
                  {CATEGORY_META[s.category].emoji} {s.name}
                </span>
                {coords && <span className="step-dist">{formatDistance(haversineKm(coords, s))}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="detail__actions">
        {remaining.length > 0 && (
          <a
            className="btn btn--ghost"
            href={gmapsRouteUrl(coords, remaining)}
            target="_blank"
            rel="noreferrer"
          >
            Itinéraire complet (Google Maps)
          </a>
        )}
        <button className="btn btn--danger" onClick={() => api.toggleActiveRoute(route.id)}>
          Quitter le parcours
        </button>
      </div>

      {celebrate && (
        <RouteComplete
          routeTitle={route.title}
          count={orderedSites.length}
          onClose={() => setCelebrate(false)}
        />
      )}
    </section>
  );
}
