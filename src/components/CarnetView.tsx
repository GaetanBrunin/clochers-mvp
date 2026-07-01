import { useRef } from 'react';
import type { Site, VisitRoute } from '../types';
import type { ProgressApi } from '../hooks/useProgress';
import { computeBadges, totalDiscoverItems } from '../lib/badges';

/** Onglet "Mon carnet" : statistiques, badges, export/import, réinitialisation. */
export function CarnetView({
  sites,
  routes,
  api,
}: {
  sites: Site[];
  routes: VisitRoute[];
  api: ProgressApi;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { progress } = api;

  const visited = progress.visitedIds.length;
  const found = progress.foundItemIds.length;
  const totalItems = totalDiscoverItems(sites);
  const badges = computeBadges(progress, sites, routes);
  const earned = badges.filter((b) => b.earned);
  const explorePct = sites.length ? Math.round((visited / sites.length) * 100) : 0;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'clochers-progression.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      api.importJson(JSON.parse(await file.text()));
    } catch {
      alert('Fichier invalide.');
    }
  };

  return (
    <div className="carnet">
      <div className="stats">
        <Stat value={`${visited}/${sites.length}`} label="Lieux visités" />
        <Stat value={`${found}/${totalItems}`} label="Trésors trouvés" />
        <Stat value={progress.favoriteIds.length} label="Favoris" />
      </div>

      <div className="progress-bar progress-bar--lg">
        <div className="progress-bar__fill" style={{ width: `${explorePct}%` }} />
      </div>
      <p className="muted">{explorePct}% du patrimoine exploré</p>

      <h3>
        Badges ({earned.length}/{badges.length})
      </h3>
      <ul className="badges">
        {badges.map((b) => (
          <li key={b.id} className={b.earned ? 'badge badge--on' : 'badge'}>
            <span className="badge__emoji">{b.emoji}</span>
            <span>{b.label}</span>
          </li>
        ))}
      </ul>

      <h3>Ma progression</h3>
      <p className="muted">
        Tout est stocké sur cet appareil. Exporte le fichier pour sauvegarder ou changer de
        téléphone.
      </p>
      <div className="detail__actions">
        <button className="btn" onClick={exportJson}>
          Exporter (JSON)
        </button>
        <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
          Importer
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = '';
          }}
        />
      </div>
      <button
        className="btn btn--danger"
        onClick={() => window.confirm('Effacer toute la progression ?') && api.reset()}
      >
        Réinitialiser
      </button>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
