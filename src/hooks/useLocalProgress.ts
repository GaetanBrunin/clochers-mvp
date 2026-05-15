import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppProgress, PersonalChurchState } from '../types/domain';

const STORAGE_KEY = 'clochers.progress.v1';

const emptyChurchState = (): PersonalChurchState => ({
  visited: false,
  favorite: false,
  personalNote: '',
  completedChallenges: {}
});

function readProgress(): AppProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AppProgress : {};
  } catch {
    return {};
  }
}

export function useLocalProgress() {
  const [progress, setProgress] = useState<AppProgress>(() => readProgress());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const getChurchState = useCallback((churchId: string): PersonalChurchState => {
    return progress[churchId] ?? emptyChurchState();
  }, [progress]);

  const updateChurchState = useCallback((churchId: string, updater: (state: PersonalChurchState) => PersonalChurchState) => {
    setProgress((current) => {
      const previous = current[churchId] ?? emptyChurchState();
      return { ...current, [churchId]: updater(previous) };
    });
  }, []);

  const toggleVisited = useCallback((churchId: string) => {
    updateChurchState(churchId, (state) => ({
      ...state,
      visited: !state.visited,
      visitedAt: !state.visited ? new Date().toISOString() : undefined
    }));
  }, [updateChurchState]);

  const toggleFavorite = useCallback((churchId: string) => {
    updateChurchState(churchId, (state) => ({ ...state, favorite: !state.favorite }));
  }, [updateChurchState]);

  const saveNote = useCallback((churchId: string, note: string) => {
    updateChurchState(churchId, (state) => ({ ...state, personalNote: note }));
  }, [updateChurchState]);

  const completeChallenge = useCallback((churchId: string, challengeId: string) => {
    updateChurchState(churchId, (state) => ({
      ...state,
      completedChallenges: {
        ...state.completedChallenges,
        [challengeId]: new Date().toISOString()
      }
    }));
  }, [updateChurchState]);

  const resetChallenge = useCallback((churchId: string, challengeId: string) => {
    updateChurchState(churchId, (state) => {
      const next = { ...state.completedChallenges };
      delete next[challengeId];
      return { ...state, completedChallenges: next };
    });
  }, [updateChurchState]);

  const stats = useMemo(() => {
    const states = Object.values(progress);
    return {
      visitedCount: states.filter((state) => state.visited).length,
      completedChallengeCount: states.reduce((total, state) => total + Object.keys(state.completedChallenges).length, 0)
    };
  }, [progress]);

  return {
    progress,
    stats,
    getChurchState,
    toggleVisited,
    toggleFavorite,
    saveNote,
    completeChallenge,
    resetChallenge
  };
}
