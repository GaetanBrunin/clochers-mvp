import type { Site, VisitRoute } from '../types';
import { Area, Field, Select, StringList, Text } from './ui';

/** Éditeur d'un parcours : infos + étapes ordonnées (choisies parmi les sites). */
export function RouteEditor({
  route,
  sites,
  onChange,
}: {
  route: VisitRoute;
  sites: Site[];
  onChange: (r: VisitRoute) => void;
}) {
  const patch = (p: Partial<VisitRoute>) => onChange({ ...route, ...p });
  const byId = new Map(sites.map((s) => [s.id, s]));
  const available = sites.filter((s) => !route.siteIds.includes(s.id));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= route.siteIds.length) return;
    const next = [...route.siteIds];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ siteIds: next });
  };

  return (
    <div className="af-form">
      <h3>Informations</h3>
      <Text label="Titre" value={route.title} onChange={(v) => patch({ title: v })} />
      <Area label="Description" value={route.description} onChange={(v) => patch({ description: v })} />
      <div className="af-2col">
        <Text label="Durée" value={route.duration} onChange={(v) => patch({ duration: v })} hint="ex. 1h15" />
        <Text label="Distance" value={route.distance} onChange={(v) => patch({ distance: v })} hint="ex. 2.1 km" />
      </div>
      <Select
        label="Difficulté"
        value={route.difficulty}
        options={[
          { value: 'easy', label: 'Facile' },
          { value: 'medium', label: 'Moyen' },
        ]}
        onChange={(v) => patch({ difficulty: v as 'easy' | 'medium' })}
      />
      <StringList label="Tags" values={route.tags} onChange={(v) => patch({ tags: v })} />

      <h3>Étapes ({route.siteIds.length})</h3>
      <Field label="Ordre des étapes">
        <ol className="af-steps">
          {route.siteIds.map((id, i) => (
            <li key={id} className="af-step">
              <span className="af-step__name">{byId.get(id)?.name ?? `⚠️ ${id} (introuvable)`}</span>
              <span className="af-step__ctrl">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === route.siteIds.length - 1}
                  aria-label="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="af__del"
                  onClick={() => patch({ siteIds: route.siteIds.filter((x) => x !== id) })}
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      </Field>

      {available.length > 0 && (
        <Field label="Ajouter une étape">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) patch({ siteIds: [...route.siteIds, e.target.value] });
            }}
          >
            <option value="">— choisir un lieu —</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}
