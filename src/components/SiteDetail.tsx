import { useState } from 'react';
import { CATEGORY_META, type Site } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import { OpeningBadge } from './OpeningBadge';
import { DiscoverCard } from './DiscoverCard';
import { DAY_LABELS, dayFromDate, groupedMassTimes, weeklyRows } from '../lib/openingHours';
import { geoUrl, googleMapsUrl, osmUrl } from '../lib/geo';

type Tab = 'infos' | 'histoire' | 'decouvrir';

/** Fiche plein écran d'un site patrimonial (overlay mobile-first). */
export function SiteDetail({
  site,
  api,
  now,
  onClose,
}: {
  site: Site;
  api: ProgressApi;
  now: Date;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('infos');
  const [heroIndex, setHeroIndex] = useState(0);

  const meta = CATEGORY_META[site.category];
  const images = [site.coverImage, ...(site.gallery ?? [])];
  const visited = api.isVisited(site.id);
  const favorite = api.isFavorite(site.id);
  const todayKey = dayFromDate(now);
  const masses = groupedMassTimes(site.massTimes ?? []);
  const discover = site.discover ?? [];
  const foundCount = discover.filter((i) => api.isFound(site.id, i.id)).length;
  const hasHistory = Boolean(site.history || site.anecdote);

  const share = async () => {
    const shareData = { title: site.name, text: `${site.name} — ${site.city}`, url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${site.name} — ${site.address}`);
        alert('Adresse copiée dans le presse-papier.');
      }
    } catch {
      /* partage annulé par l'utilisateur */
    }
  };

  return (
    <div className="detail" role="dialog" aria-label={site.name}>
      <div className="detail__hero">
        <img src={images[heroIndex]} alt={site.name} />
        <button className="detail__close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        {images.length > 1 && (
          <div className="detail__thumbs">
            {images.map((src, i) => (
              <button
                key={src}
                className={i === heroIndex ? 'thumb thumb--on' : 'thumb'}
                onClick={() => setHeroIndex(i)}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail__body">
        <header className="detail__header">
          <div>
            <span className="cat-tag">
              {meta.emoji} {meta.label}
            </span>
            <h2>{site.name}</h2>
            <p className="detail__city">{site.city}</p>
          </div>
          <OpeningBadge site={site} now={now} />
        </header>

        <p className="detail__lead">{site.shortDescription}</p>

        <div className="detail__actions">
          <button className={`chip ${visited ? 'chip--on' : ''}`} onClick={() => api.toggleVisited(site.id)}>
            {visited ? '✓ Visité' : 'Marquer visité'}
          </button>
          <button className={`chip ${favorite ? 'chip--on' : ''}`} onClick={() => api.toggleFavorite(site.id)}>
            {favorite ? '★ Favori' : '☆ Favori'}
          </button>
          <button className="chip" onClick={share}>
            Partager
          </button>
        </div>

        <div className="tabs">
          <button className={tab === 'infos' ? 'tab tab--on' : 'tab'} onClick={() => setTab('infos')}>
            Infos
          </button>
          {hasHistory && (
            <button
              className={tab === 'histoire' ? 'tab tab--on' : 'tab'}
              onClick={() => setTab('histoire')}
            >
              Histoire
            </button>
          )}
          <button
            className={tab === 'decouvrir' ? 'tab tab--on' : 'tab'}
            onClick={() => setTab('decouvrir')}
          >
            À découvrir {discover.length > 0 && `(${foundCount}/${discover.length})`}
          </button>
        </div>

        {tab === 'infos' && (
          <section className="tab-panel">
            <h3>Y aller</h3>
            <p className="muted">{site.address}</p>
            <div className="detail__actions">
              <a className="btn" href={googleMapsUrl(site.latitude, site.longitude)} target="_blank" rel="noreferrer">
                Google Maps
              </a>
              <a className="btn btn--ghost" href={geoUrl(site.latitude, site.longitude, site.name)}>
                App Plans
              </a>
              <a className="btn btn--ghost" href={osmUrl(site.latitude, site.longitude)} target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>
            </div>

            {site.access && (
              <>
                <div className="access">
                  <span className={site.access.pmr ? 'access--yes' : 'access--no'}>♿ PMR</span>
                  <span className={site.access.parking ? 'access--yes' : 'access--no'}>🅿️ Parking</span>
                  <span className={site.access.publicTransport ? 'access--yes' : 'access--no'}>🚌 Transports</span>
                </div>
                {site.access.notes && <p className="muted">{site.access.notes}</p>}
              </>
            )}

            {(site.hours || site.openingNotes) && (
              <>
                <h3>{meta.religious ? 'Horaires d’ouverture' : 'Horaires de visite'}</h3>
                {site.hours ? (
                  <ul className="hours">
                    {weeklyRows(site.hours).map(({ day, ranges }) => (
                      <li key={day} className={day === todayKey ? 'hours__row hours__row--today' : 'hours__row'}>
                        <span>{DAY_LABELS[day]}</span>
                        <span>{ranges.length ? ranges.join(', ').replace(/-/g, ' – ') : 'Fermé'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Pas d’horaires réguliers.</p>
                )}
                {site.openingNotes && <p className="muted">{site.openingNotes}</p>}
              </>
            )}

            {meta.religious && (
              <>
                <h3>Horaires des messes</h3>
                {masses.length ? (
                  <ul className="hours">
                    {masses.map(({ day, masses: dayMasses }) => (
                      <li key={day} className="hours__row">
                        <span>{DAY_LABELS[day]}</span>
                        <span>{dayMasses.map((m) => `${m.time}${m.label ? ` (${m.label})` : ''}`).join(', ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Consulter le calendrier diocésain.</p>
                )}
              </>
            )}

            {site.lastScheduleUpdate && (
              <p className="update-note">Horaires mis à jour le {formatDate(site.lastScheduleUpdate)}.</p>
            )}
          </section>
        )}

        {tab === 'histoire' && (
          <section className="tab-panel">
            {site.anecdote && (
              <p className="anecdote">💡 Le saviez-vous ? {site.anecdote}</p>
            )}
            {site.history && (
              <>
                {site.history.foundationDate && (
                  <p className="found-date">Origine : {site.history.foundationDate}</p>
                )}
                <p>{site.history.shortText}</p>
                {site.history.longText && <p>{site.history.longText}</p>}
                {site.history.sources && site.history.sources.length > 0 && (
                  <p className="muted">Sources : {site.history.sources.join(', ')}.</p>
                )}
              </>
            )}
          </section>
        )}

        {tab === 'decouvrir' && (
          <section className="tab-panel">
            {discover.length === 0 ? (
              <p className="muted">Aucun élément à découvrir renseigné pour le moment.</p>
            ) : (
              <>
                <p className="muted">
                  {foundCount} / {discover.length} élément(s) découvert(s).
                </p>
                {discover.map((item) => (
                  <DiscoverCard key={item.id} site={site} item={item} api={api} />
                ))}
              </>
            )}
          </section>
        )}

        <label className="notes">
          <span>Mes notes</span>
          <textarea
            placeholder="Ce que j’ai vu, ce que je veux revoir…"
            value={api.progress.notes[site.id] ?? ''}
            onChange={(e) => api.saveNote(site.id, e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
