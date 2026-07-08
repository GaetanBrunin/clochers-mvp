// Progression du visiteur, stockée uniquement dans le localStorage du téléphone.
// Aucune donnée n'est envoyée sur un serveur. Les identifiants sont ceux des
// "sites" (églises, statues, monuments…), le modèle étant généralisé.

export type QuizAnswer = { answer: string; isCorrect: boolean };

export type Progress = {
  version: 2;
  visitedIds: string[];
  favoriteIds: string[];
  /** Identifiants "siteId:itemId" des éléments cochés "Trouvé / Vu". */
  foundItemIds: string[];
  /** Réponses aux quiz, clé "siteId:itemId". */
  quizAnswers: Record<string, QuizAnswer>;
  notes: Record<string, string>;
  visitDates: Record<string, string>;
  /** Parcours guidé en cours (un seul actif à la fois), ou null. */
  activeRouteId: string | null;
};

const KEY = 'clochers_progress_v2';

const base = (): Progress => ({
  version: 2,
  visitedIds: [],
  favoriteIds: [],
  foundItemIds: [],
  quizAnswers: {},
  notes: {},
  visitDates: {},
  activeRouteId: null,
});

const uniq = (v: string[]): string[] => [...new Set(v)];

export const itemKey = (siteId: string, itemId: string): string => `${siteId}:${itemId}`;

export function getProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base();
    const p = JSON.parse(raw) as Partial<Progress>;
    return {
      ...base(),
      ...p,
      visitedIds: uniq(p?.visitedIds ?? []),
      favoriteIds: uniq(p?.favoriteIds ?? []),
      foundItemIds: uniq(p?.foundItemIds ?? []),
    };
  } catch {
    return base();
  }
}

export function saveProgress(p: Progress): Progress {
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

/** Applique une transformation et persiste ; renvoie le nouvel état. */
function update(fn: (p: Progress) => Progress): Progress {
  return saveProgress(fn(getProgress()));
}

export const toggleFavorite = (id: string): Progress =>
  update((p) => ({
    ...p,
    favoriteIds: p.favoriteIds.includes(id)
      ? p.favoriteIds.filter((x) => x !== id)
      : [...p.favoriteIds, id],
  }));

export const toggleVisited = (id: string, nowIso: string): Progress =>
  update((p) => {
    const isVisited = p.visitedIds.includes(id);
    const visitDates = { ...p.visitDates };
    if (isVisited) delete visitDates[id];
    else visitDates[id] = nowIso;
    return {
      ...p,
      visitedIds: isVisited ? p.visitedIds.filter((x) => x !== id) : uniq([...p.visitedIds, id]),
      visitDates,
    };
  });

export const toggleItemFound = (siteId: string, itemId: string): Progress =>
  update((p) => {
    const key = itemKey(siteId, itemId);
    const found = p.foundItemIds.includes(key);
    return {
      ...p,
      foundItemIds: found
        ? p.foundItemIds.filter((x) => x !== key)
        : uniq([...p.foundItemIds, key]),
    };
  });

export const saveQuizAnswer = (
  siteId: string,
  itemId: string,
  answer: string,
  isCorrect: boolean
): Progress =>
  update((p) => ({
    ...p,
    quizAnswers: { ...p.quizAnswers, [itemKey(siteId, itemId)]: { answer, isCorrect } },
  }));

export const saveNote = (id: string, note: string): Progress =>
  update((p) => ({ ...p, notes: { ...p.notes, [id]: note } }));

/** Rejoint le parcours (ou le quitte s'il est déjà actif). Un seul actif à la fois. */
export const toggleActiveRoute = (routeId: string): Progress =>
  update((p) => ({ ...p, activeRouteId: p.activeRouteId === routeId ? null : routeId }));

export const resetProgress = (): Progress => {
  localStorage.removeItem(KEY);
  return base();
};

export const importProgress = (data: unknown): Progress => {
  const merged = { ...base(), ...(data as Partial<Progress>) };
  return saveProgress(merged as Progress);
};
