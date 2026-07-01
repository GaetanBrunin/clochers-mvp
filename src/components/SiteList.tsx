import { useMemo, useState } from 'react';
import { CATEGORY_META, type Site, type SiteCategory } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import { OpeningBadge } from './OpeningBadge';
import { formatDistance, haversineKm } from '../lib/geo';
import { useGeolocation } from '../hooks/useGeolocation';

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Liste filtrable des sites : recherche, catégorie, tags, favoris, non visités, proximité. */
export function SiteList({
  sites,
  api,
  now,
  onSelect,
}: {
  sites: Site[];
  api: ProgressApi;
  now: Date;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<SiteCategory | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [unvisitedOnly, setUnvisitedOnly] = useState(false);
  const geo = useGeolocation();

  // Catégories réellement présentes dans les données, dans l'ordre du référentiel.
  const categories = useMemo(() => {
    const present = new Set(sites.map((s) => s.category));
    return (Object.keys(CATEGORY_META) as SiteCategory[]).filter((c) => present.has(c));
  }, [sites]);

  const allTags = useMemo(() => [...new Set(sites.flatMap((s) => s.tags))].sort(), [sites]);

  const list = useMemo(() => {
    const nq = normalize(q);
    let result = sites.filter((s) => {
      const haystack = normalize(`${s.name} ${s.city} ${s.shortDescription} ${s.tags.join(' ')}`);
      if (nq && !haystack.includes(nq)) return false;
      if (category && s.category !== category) return false;
      if (tag && !s.tags.includes(tag)) return false;
      if (favOnly && !api.isFavorite(s.id)) return false;
      if (unvisitedOnly && api.isVisited(s.id)) return false;
      return true;
    });
    if (geo.coords) {
      const from = geo.coords;
      result = [...result].sort((a, b) => haversineKm(from, a) - haversineKm(from, b));
    }
    return result;
  }, [sites, q, category, tag, favOnly, unvisitedOnly, api, geo.coords]);

  return (
    <div className="list">
      <div className="list__controls">
        <input
          className="search"
          placeholder="Rechercher un lieu, une ville…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn--ghost" onClick={geo.locate}>
          {geo.status === 'loading' ? 'Localisation…' : '📍 Autour de moi'}
        </button>
      </div>

      {geo.status === 'denied' && <p className="muted">Localisation refusée.</p>}

      <div className="tags-row">
        <button className={!category ? 'tag tag--on' : 'tag'} onClick={() => setCategory(null)}>
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? 'tag tag--on' : 'tag'}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
          </button>
        ))}
      </div>

      <div className="tags-row">
        <button className={!tag ? 'tag tag--sm tag--on' : 'tag tag--sm'} onClick={() => setTag(null)}>
          # tous
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            className={tag === t ? 'tag tag--sm tag--on' : 'tag tag--sm'}
            onClick={() => setTag(tag === t ? null : t)}
          >
            #{t}
          </button>
        ))}
      </div>

      <div className="filters-row">
        <label>
          <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /> Favoris
        </label>
        <label>
          <input
            type="checkbox"
            checked={unvisitedOnly}
            onChange={(e) => setUnvisitedOnly(e.target.checked)}
          />{' '}
          Non visités
        </label>
      </div>

      {list.length === 0 && <p className="muted">Aucun lieu ne correspond.</p>}

      <ul className="cards">
        {list.map((s) => {
          const dist = geo.coords ? haversineKm(geo.coords, s) : null;
          return (
            <li key={s.id}>
              <button className="church-card" onClick={() => onSelect(s.id)}>
                <img src={s.coverImage} alt={s.name} loading="lazy" />
                <div className="church-card__body">
                  <span className="cat-tag">
                    {CATEGORY_META[s.category].emoji} {CATEGORY_META[s.category].label}
                  </span>
                  <div className="church-card__top">
                    <h3>{s.name}</h3>
                    {api.isVisited(s.id) && <span className="dot-visited" title="Visité">✓</span>}
                  </div>
                  <p className="muted">
                    {s.city}
                    {dist !== null && ` · ${formatDistance(dist)}`}
                  </p>
                  <OpeningBadge site={s} now={now} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
