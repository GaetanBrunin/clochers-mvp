import type { Site } from '../types';
import { computeOpenState, STATUS_LABELS } from '../lib/openingHours';

/**
 * Pastille de statut : "Ouvert / Fermé" calculé depuis les horaires si
 * disponibles, sinon le statut éditorial (accès libre, sur demande…). Renvoie
 * null si le site n'a ni horaires ni statut (ex. une rue).
 */
export function OpeningBadge({ site, now }: { site: Site; now: Date }) {
  const open = computeOpenState(site.hours, now);

  if (open) {
    return (
      <span className={`pill ${open.isOpen ? 'pill--open' : 'pill--closed'}`}>{open.label}</span>
    );
  }

  if (!site.openingStatus) return null;

  const tone =
    site.openingStatus === 'regular' || site.openingStatus === 'free_access'
      ? 'pill--open'
      : site.openingStatus === 'closed'
        ? 'pill--closed'
        : 'pill--neutral';
  return <span className={`pill ${tone}`}>{STATUS_LABELS[site.openingStatus]}</span>;
}
