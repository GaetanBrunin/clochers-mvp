export type ChallengeType = 'observation' | 'photo' | 'question' | 'silence';

export type Challenge = {
  id: string;
  title: string;
  type: ChallengeType;
  description: string;
  hint?: string;
  question?: string;
  expectedAnswer?: string;
};

export type Church = {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  heroImage: string;
  shortDescription: string;
  anecdote: string;
  tags: string[];
  challenges: Challenge[];
};

export type PersonalChurchState = {
  visited?: boolean;
  favorite?: boolean;
  personalNote?: string;
  visitedAt?: string;
  completedChallenges: Record<string, string>;
};

export type AppProgress = Record<string, PersonalChurchState>;
