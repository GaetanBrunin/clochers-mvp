import type { Day, MassTime, OpeningStatus, WeeklyHours } from '../types';

const DAY_ORDER: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<Day, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

/** Convertit l'index JS de Date.getDay() (0 = dimanche) en clé Day. */
export function dayFromDate(d: Date): Day {
  return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Day[])[d.getDay()];
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export type OpenState = {
  isOpen: boolean;
  /** Message court, ex. "Ouvert · ferme à 18h00" ou "Fermé · ouvre demain 09h30". */
  label: string;
};

/**
 * Calcule si l'église est ouverte à l'instant `now` à partir des horaires
 * structurés. Renvoie null si l'église n'a pas d'horaires réguliers (on se
 * rabat alors sur le statut éditorial).
 */
export function computeOpenState(hours: WeeklyHours | undefined, now: Date): OpenState | null {
  if (!hours || Object.keys(hours).length === 0) return null;

  const today = dayFromDate(now);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const fmt = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;

  for (const range of hours[today] ?? []) {
    const [start, end] = range.split('-').map(toMinutes);
    if (minutesNow >= start && minutesNow < end) {
      return { isOpen: true, label: `Ouvert · ferme à ${fmt(end)}` };
    }
    if (minutesNow < start) {
      return { isOpen: false, label: `Fermé · ouvre à ${fmt(start)}` };
    }
  }

  // Cherche le prochain jour d'ouverture (dans les 7 jours qui suivent).
  const todayIndex = DAY_ORDER.indexOf(today);
  for (let i = 1; i <= 7; i++) {
    const day = DAY_ORDER[(todayIndex + i) % 7];
    const ranges = hours[day];
    if (ranges && ranges.length > 0) {
      const [start] = ranges[0].split('-').map(toMinutes);
      const when = i === 1 ? 'demain' : DAY_LABELS[day].toLowerCase();
      return { isOpen: false, label: `Fermé · ouvre ${when} ${fmt(start)}` };
    }
  }

  return { isOpen: false, label: 'Fermé' };
}

/** Liste ordonnée (Lun→Dim) des créneaux, pour l'affichage dans la fiche. */
export function weeklyRows(hours: WeeklyHours | undefined): { day: Day; ranges: string[] }[] {
  return DAY_ORDER.map((day) => ({ day, ranges: hours?.[day] ?? [] }));
}

/** Regroupe les messes par jour, dans l'ordre de la semaine. */
export function groupedMassTimes(masses: MassTime[]): { day: Day; masses: MassTime[] }[] {
  return DAY_ORDER.map((day) => ({ day, masses: masses.filter((m) => m.day === day) })).filter(
    (r) => r.masses.length > 0
  );
}

export const STATUS_LABELS: Record<OpeningStatus, string> = {
  regular: 'Ouvert régulièrement',
  mass_only: 'Ouvert pendant les offices',
  on_request: 'Sur demande',
  free_access: 'Accès libre',
  closed: 'Fermé au public',
  unknown: 'Horaires à confirmer',
};
