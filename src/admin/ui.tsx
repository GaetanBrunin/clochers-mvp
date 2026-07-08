import type { ReactNode } from 'react';

/** Bloc label + champ. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="af">
      <span className="af__label">{label}</span>
      {children}
      {hint && <span className="af__hint">{hint}</span>}
    </label>
  );
}

export function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Num({
  label,
  value,
  onChange,
  step = 'any',
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  step?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="af af--check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Éditeur d'une liste de chaînes (tags, réponses acceptées, sources, choix QCM…). */
export function StringList({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const set = (i: number, v: string) => onChange(values.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => onChange(values.filter((_, j) => j !== i));
  return (
    <Field label={label} hint={hint}>
      <div className="af__list">
        {values.map((v, i) => (
          <div className="af__row" key={i}>
            <input value={v} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} />
            <button type="button" className="af__del" onClick={() => remove(i)} aria-label="Supprimer">
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="af__add" onClick={() => onChange([...values, ''])}>
          ＋ Ajouter
        </button>
      </div>
    </Field>
  );
}

/** Encadré repliable pour regrouper une section ou un élément de liste. */
export function Card({
  title,
  children,
  onRemove,
}: {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <div className="af-card">
      <div className="af-card__head">
        <strong>{title}</strong>
        {onRemove && (
          <button type="button" className="af__del" onClick={onRemove}>
            Supprimer
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
