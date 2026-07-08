import {
  CATEGORY_META,
  type Day,
  type DiscoverItem,
  type DiscoverQuestion,
  type MassTime,
  type OpeningStatus,
  type Site,
  type SiteCategory,
} from '../types';
import { DAY_LABELS } from '../lib/openingHours';
import { Area, Card, Check, Field, Num, Select, StringList, Text } from './ui';

const DAYS = Object.keys(DAY_LABELS) as Day[];

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_META) as SiteCategory[]).map((k) => ({
  value: k,
  label: `${CATEGORY_META[k].emoji} ${CATEGORY_META[k].label}`,
}));

const STATUS_OPTIONS: { value: OpeningStatus | ''; label: string }[] = [
  { value: '', label: '— aucun —' },
  { value: 'regular', label: 'Ouvert régulièrement' },
  { value: 'mass_only', label: 'Pendant les offices' },
  { value: 'on_request', label: 'Sur demande' },
  { value: 'free_access', label: 'Accès libre' },
  { value: 'closed', label: 'Fermé au public' },
  { value: 'unknown', label: 'À confirmer' },
];

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Éditeur complet d'un site. `site` est modifié via `onChange` (copie immuable). */
export function SiteEditor({ site, onChange }: { site: Site; onChange: (s: Site) => void }) {
  const patch = (p: Partial<Site>) => onChange({ ...site, ...p });

  return (
    <div className="af-form">
      <h3>Informations</h3>
      <Text label="Nom" value={site.name} onChange={(v) => patch({ name: v })} />
      <Select
        label="Catégorie"
        value={site.category}
        options={CATEGORY_OPTIONS}
        onChange={(v) => patch({ category: v })}
      />
      <Text label="Ville" value={site.city} onChange={(v) => patch({ city: v })} />
      <Text label="Adresse" value={site.address} onChange={(v) => patch({ address: v })} />
      <div className="af-2col">
        <Num label="Latitude" value={site.latitude} onChange={(v) => patch({ latitude: v })} hint="ex. 50.1754" />
        <Num label="Longitude" value={site.longitude} onChange={(v) => patch({ longitude: v })} hint="ex. 3.2362" />
      </div>
      <Text
        label="Image de couverture"
        value={site.coverImage}
        onChange={(v) => patch({ coverImage: v })}
        hint="URL, ou photos/mon-image.jpg (déposée dans public/photos/)"
      />
      <StringList
        label="Galerie (autres photos)"
        values={site.gallery ?? []}
        onChange={(v) => patch({ gallery: v.length ? v : undefined })}
        placeholder="URL ou photos/…"
      />
      <Area
        label="Description courte"
        value={site.shortDescription}
        onChange={(v) => patch({ shortDescription: v })}
      />
      <Area
        label="Anecdote « Le saviez-vous ? »"
        value={site.anecdote ?? ''}
        onChange={(v) => patch({ anecdote: v || undefined })}
      />
      <StringList
        label="Tags"
        values={site.tags}
        onChange={(v) => patch({ tags: v })}
        placeholder="ex. vitraux"
      />

      <h3>Visite & horaires</h3>
      <Select
        label="Statut d'ouverture"
        value={site.openingStatus ?? ''}
        options={STATUS_OPTIONS}
        onChange={(v) => patch({ openingStatus: (v || undefined) as OpeningStatus | undefined })}
      />
      <Area
        label="Note d'ouverture"
        value={site.openingNotes ?? ''}
        onChange={(v) => patch({ openingNotes: v || undefined })}
        rows={2}
      />
      <Text
        label="Dernière mise à jour des horaires"
        value={site.lastScheduleUpdate ?? ''}
        onChange={(v) => patch({ lastScheduleUpdate: v || undefined })}
        hint="format AAAA-MM-JJ, ex. 2026-07-08"
      />

      <details className="af-details">
        <summary>Horaires d'ouverture (par jour)</summary>
        <p className="af__hint">
          Un ou plusieurs créneaux « HH:MM-HH:MM » séparés par une virgule. Laisse vide = fermé ce jour.
        </p>
        {DAYS.map((day) => (
          <Text
            key={day}
            label={DAY_LABELS[day]}
            value={(site.hours?.[day] ?? []).join(', ')}
            placeholder="09:30-12:00, 14:00-18:00"
            onChange={(v) => {
              const ranges = v.split(',').map((s) => s.trim()).filter(Boolean);
              const hours = { ...(site.hours ?? {}) };
              if (ranges.length) hours[day] = ranges;
              else delete hours[day];
              patch({ hours: Object.keys(hours).length ? hours : undefined });
            }}
          />
        ))}
      </details>

      <details className="af-details">
        <summary>Horaires des messes ({site.massTimes?.length ?? 0})</summary>
        <MassTimesEditor
          masses={site.massTimes ?? []}
          onChange={(m) => patch({ massTimes: m.length ? m : undefined })}
        />
      </details>

      <details className="af-details">
        <summary>Accessibilité</summary>
        <Check
          label="Renseigner l'accessibilité"
          checked={!!site.access}
          onChange={(on) =>
            patch({ access: on ? { pmr: false, parking: false, publicTransport: false } : undefined })
          }
        />
        {site.access && (
          <>
            <Check
              label="Accessible PMR"
              checked={site.access.pmr}
              onChange={(v) => patch({ access: { ...site.access!, pmr: v } })}
            />
            <Check
              label="Parking à proximité"
              checked={site.access.parking}
              onChange={(v) => patch({ access: { ...site.access!, parking: v } })}
            />
            <Check
              label="Transports en commun"
              checked={site.access.publicTransport}
              onChange={(v) => patch({ access: { ...site.access!, publicTransport: v } })}
            />
            <Area
              label="Notes d'accès"
              rows={2}
              value={site.access.notes ?? ''}
              onChange={(v) => patch({ access: { ...site.access!, notes: v || undefined } })}
            />
          </>
        )}
      </details>

      <h3>Histoire</h3>
      <Check
        label="Renseigner l'histoire"
        checked={!!site.history}
        onChange={(on) => patch({ history: on ? { shortText: '' } : undefined })}
      />
      {site.history && (
        <>
          <Text
            label="Origine / fondation"
            value={site.history.foundationDate ?? ''}
            onChange={(v) => patch({ history: { ...site.history!, foundationDate: v || undefined } })}
            hint="ex. XIIe siècle, 1132…"
          />
          <Area
            label="Texte court"
            value={site.history.shortText}
            onChange={(v) => patch({ history: { ...site.history!, shortText: v } })}
          />
          <Area
            label="Texte long"
            rows={5}
            value={site.history.longText ?? ''}
            onChange={(v) => patch({ history: { ...site.history!, longText: v || undefined } })}
          />
          <StringList
            label="Sources"
            values={site.history.sources ?? []}
            onChange={(v) => patch({ history: { ...site.history!, sources: v.length ? v : undefined } })}
          />
        </>
      )}

      <h3>À découvrir ({site.discover?.length ?? 0})</h3>
      <DiscoverListEditor
        items={site.discover ?? []}
        onChange={(d) => patch({ discover: d })}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Messes
function MassTimesEditor({ masses, onChange }: { masses: MassTime[]; onChange: (m: MassTime[]) => void }) {
  const set = (i: number, m: MassTime) => onChange(masses.map((x, j) => (j === i ? m : x)));
  return (
    <div className="af__list">
      {masses.map((m, i) => (
        <div className="af-mass" key={i}>
          <select value={m.day} onChange={(e) => set(i, { ...m, day: e.target.value as Day })}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {DAY_LABELS[d]}
              </option>
            ))}
          </select>
          <input
            value={m.time}
            placeholder="10:30"
            onChange={(e) => set(i, { ...m, time: e.target.value })}
          />
          <input
            value={m.label ?? ''}
            placeholder="Messe dominicale"
            onChange={(e) => set(i, { ...m, label: e.target.value || undefined })}
          />
          <button type="button" className="af__del" onClick={() => onChange(masses.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="af__add"
        onClick={() => onChange([...masses, { day: 'sun', time: '' }])}
      >
        ＋ Ajouter une messe
      </button>
    </div>
  );
}

// ------------------------------------------------------------- À découvrir
function DiscoverListEditor({
  items,
  onChange,
}: {
  items: DiscoverItem[];
  onChange: (d: DiscoverItem[]) => void;
}) {
  const set = (i: number, it: DiscoverItem) => onChange(items.map((x, j) => (j === i ? it : x)));
  const add = () =>
    onChange([...items, { id: `item-${items.length + 1}`, title: '', description: '' }]);

  return (
    <div>
      {items.map((it, i) => (
        <Card key={i} title={it.title || `Élément ${i + 1}`} onRemove={() => onChange(items.filter((_, j) => j !== i))}>
          <Text label="Titre" value={it.title} onChange={(v) => set(i, { ...it, title: v, id: it.id || slugify(v) })} />
          <Area label="Description / anecdote" value={it.description} onChange={(v) => set(i, { ...it, description: v })} />
          <Text
            label="Indice de localisation"
            value={it.locationHint ?? ''}
            onChange={(v) => set(i, { ...it, locationHint: v || undefined })}
            hint="ex. Près du chœur, côté droit"
          />
          <ImagesEditor
            images={it.images ?? []}
            onChange={(imgs) => set(i, { ...it, images: imgs.length ? imgs : undefined })}
          />
          <QuestionEditor
            question={it.question}
            onChange={(q) => set(i, { ...it, question: q })}
          />
        </Card>
      ))}
      <button type="button" className="af__add" onClick={add}>
        ＋ Ajouter un élément à découvrir
      </button>
    </div>
  );
}

function ImagesEditor({
  images,
  onChange,
}: {
  images: { src: string; caption?: string }[];
  onChange: (i: { src: string; caption?: string }[]) => void;
}) {
  const set = (i: number, v: { src: string; caption?: string }) =>
    onChange(images.map((x, j) => (j === i ? v : x)));
  return (
    <Field label="Images (avec légende)">
      <div className="af__list">
        {images.map((img, i) => (
          <div className="af-img" key={i}>
            <input
              value={img.src}
              placeholder="URL ou photos/detail.jpg"
              onChange={(e) => set(i, { ...img, src: e.target.value })}
            />
            <input
              value={img.caption ?? ''}
              placeholder="Légende (facultatif)"
              onChange={(e) => set(i, { ...img, caption: e.target.value || undefined })}
            />
            <button type="button" className="af__del" onClick={() => onChange(images.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="af__add" onClick={() => onChange([...images, { src: '' }])}>
          ＋ Ajouter une image
        </button>
      </div>
    </Field>
  );
}

function QuestionEditor({
  question,
  onChange,
}: {
  question?: DiscoverQuestion;
  onChange: (q: DiscoverQuestion | undefined) => void;
}) {
  if (!question) {
    return (
      <button
        type="button"
        className="af__add"
        onClick={() => onChange({ type: 'text', label: '', answers: [''] })}
      >
        ＋ Ajouter une question
      </button>
    );
  }
  const patch = (p: Partial<DiscoverQuestion>) => onChange({ ...question, ...p });
  return (
    <Card title="Question" onRemove={() => onChange(undefined)}>
      <Select
        label="Type"
        value={question.type}
        options={[
          { value: 'text', label: 'Réponse libre' },
          { value: 'qcm', label: 'QCM (choix multiples)' },
        ]}
        onChange={(v) => patch({ type: v as 'text' | 'qcm' })}
      />
      <Area label="Question posée" rows={2} value={question.label} onChange={(v) => patch({ label: v })} />
      {question.type === 'qcm' && (
        <StringList
          label="Choix proposés"
          values={question.choices ?? []}
          onChange={(v) => patch({ choices: v })}
          placeholder="ex. Bleu"
        />
      )}
      <StringList
        label="Réponses acceptées"
        values={question.answers}
        onChange={(v) => patch({ answers: v })}
        hint="Insensible aux accents/majuscules. Mets plusieurs variantes."
        placeholder="ex. Abbaye de Vaucelles"
      />
      <Area
        label="Indice"
        rows={2}
        value={question.hint ?? ''}
        onChange={(v) => patch({ hint: v || undefined })}
        hint="Guide le regard sans donner la réponse."
      />
      <Area
        label="Explication (après bonne réponse)"
        rows={2}
        value={question.explanation ?? ''}
        onChange={(v) => patch({ explanation: v || undefined })}
      />
    </Card>
  );
}
