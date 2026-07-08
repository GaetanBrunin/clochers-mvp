import type { Site, VisitRoute } from '../types';
import { itemKey, type Progress } from './progress';

export type Badge = {
  id: string;
  label: string;
  emoji: string;
  earned: boolean;
};

/** Nombre total d'éléments "À découvrir" dans le corpus. */
export const totalDiscoverItems = (sites: Site[]): number =>
  sites.reduce((n, s) => n + (s.discover?.length ?? 0), 0);

/**
 * Calcule les badges à partir de la progression. Fonction pure : pas d'effet de
 * bord, recalculée à chaque rendu. Simple à étendre (ajoute un objet).
 */
export function computeBadges(progress: Progress, sites: Site[], routes: VisitRoute[]): Badge[] {
  const visited = progress.visitedIds.length;
  const found = progress.foundItemIds.length;

  const cityCompleted = (city: string) =>
    sites.filter((s) => s.city === city).every((s) => progress.visitedIds.includes(s.id));

  const categoryVisited = (predicate: (s: Site) => boolean) =>
    sites.filter(predicate).some((s) => progress.visitedIds.includes(s.id));

  const anyRouteDone = routes.some((r) =>
    r.siteIds.every((id) => progress.visitedIds.includes(id))
  );

  const allFound = sites.every((s) =>
    (s.discover ?? []).every((i) => progress.foundItemIds.includes(itemKey(s.id, i.id)))
  );

  return [
    { id: 'first-visit', emoji: '📍', label: 'Premier lieu visité', earned: visited >= 1 },
    { id: 'five-visits', emoji: '🚶', label: '5 lieux visités', earned: visited >= 5 },
    { id: 'first-found', emoji: '🔍', label: 'Premier trésor trouvé', earned: found >= 1 },
    { id: 'five-found', emoji: '🏆', label: '5 trésors découverts', earned: found >= 5 },
    {
      id: 'religious',
      emoji: '⛪',
      label: 'Patrimoine religieux',
      earned: categoryVisited((s) => ['eglise', 'chapelle', 'abbaye', 'cathedrale'].includes(s.category)),
    },
    {
      id: 'civil',
      emoji: '🏛️',
      label: 'Patrimoine civil',
      earned: categoryVisited((s) => ['monument', 'statue', 'batiment', 'musee', 'place', 'rue'].includes(s.category)),
    },
    { id: 'cambrai-complete', emoji: '🏰', label: 'Cambrai exploré', earned: cityCompleted('Cambrai') },
    { id: 'route-done', emoji: '🗺️', label: 'Premier parcours terminé', earned: anyRouteDone },
    { id: 'all-found', emoji: '👑', label: 'Tous les trésors trouvés', earned: allFound },
  ];
}
