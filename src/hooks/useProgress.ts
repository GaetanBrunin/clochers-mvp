import { useCallback, useState } from 'react';
import {
  getProgress,
  importProgress,
  itemKey,
  resetProgress,
  saveNote,
  saveQuizAnswer,
  toggleActiveRoute,
  toggleFavorite,
  toggleItemFound,
  toggleVisited,
  type Progress,
} from '../lib/progress';

/**
 * Expose la progression et des actions qui la mettent à jour tout en
 * re-rendant le composant. Toutes les écritures passent par le localStorage.
 */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => getProgress());

  const isVisited = useCallback((id: string) => progress.visitedIds.includes(id), [progress]);
  const isFavorite = useCallback((id: string) => progress.favoriteIds.includes(id), [progress]);
  const isFound = useCallback(
    (siteId: string, itemId: string) => progress.foundItemIds.includes(itemKey(siteId, itemId)),
    [progress]
  );

  return {
    progress,
    isVisited,
    isFavorite,
    isFound,
    toggleFavorite: (id: string) => setProgress(toggleFavorite(id)),
    toggleVisited: (id: string) => setProgress(toggleVisited(id, new Date().toISOString())),
    toggleItemFound: (siteId: string, itemId: string) =>
      setProgress(toggleItemFound(siteId, itemId)),
    saveQuizAnswer: (siteId: string, itemId: string, answer: string, ok: boolean) =>
      setProgress(saveQuizAnswer(siteId, itemId, answer, ok)),
    saveNote: (id: string, note: string) => setProgress(saveNote(id, note)),
    toggleActiveRoute: (routeId: string) => setProgress(toggleActiveRoute(routeId)),
    reset: () => setProgress(resetProgress()),
    importJson: (data: unknown) => setProgress(importProgress(data)),
  };
}

export type ProgressApi = ReturnType<typeof useProgress>;
