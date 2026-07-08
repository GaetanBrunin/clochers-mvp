// Modèle de données unifié : un "Site" est n'importe quel élément du patrimoine
// (église, statue, monument, bâtiment, rue, place…). Les champs propres au culte
// (messes) ou aux lieux qui se visitent (horaires) sont optionnels.

/** Jours de la semaine, clés stables pour les horaires. */
export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Catégorie d'un site : sert au filtrage, à l'icône sur la carte, aux sections affichées. */
export type SiteCategory =
  | 'eglise'
  | 'chapelle'
  | 'abbaye'
  | 'cathedrale'
  | 'statue'
  | 'monument'
  | 'batiment'
  | 'musee'
  | 'rue'
  | 'place'
  | 'autre';

/** Métadonnées par catégorie : libellé, pictogramme, et si c'est un lieu de culte. */
export const CATEGORY_META: Record<
  SiteCategory,
  { label: string; emoji: string; religious?: boolean }
> = {
  eglise: { label: 'Église', emoji: '⛪', religious: true },
  chapelle: { label: 'Chapelle', emoji: '🕊️', religious: true },
  abbaye: { label: 'Abbaye', emoji: '⛪', religious: true },
  cathedrale: { label: 'Cathédrale', emoji: '⛪', religious: true },
  statue: { label: 'Statue', emoji: '🗿' },
  monument: { label: 'Monument', emoji: '🏛️' },
  batiment: { label: 'Bâtiment', emoji: '🏢' },
  musee: { label: 'Musée', emoji: '🖼️' },
  rue: { label: 'Rue', emoji: '🛣️' },
  place: { label: 'Place', emoji: '⛲' },
  autre: { label: 'Lieu', emoji: '📍' },
};

/** Statut d'ouverture éditorial (repli si pas d'horaires précis). */
export type OpeningStatus =
  | 'regular'
  | 'mass_only'
  | 'on_request'
  | 'free_access' // extérieur, accessible librement (statue, rue, place…)
  | 'closed'
  | 'unknown';

/** Pour chaque jour, une liste de créneaux "HH:MM-HH:MM". */
export type WeeklyHours = Partial<Record<Day, string[]>>;

/** Un office récurrent (messe, vêpres…). */
export type MassTime = {
  day: Day;
  time: string; // "10:30"
  label?: string;
};

export type AccessInfo = {
  pmr: boolean;
  parking: boolean;
  publicTransport: boolean;
  notes?: string;
};

export type History = {
  foundationDate?: string;
  shortText: string;
  longText?: string;
  sources?: string[];
};

/** Question posée sur un élément "À découvrir" (optionnelle). */
export type DiscoverQuestion = {
  type: 'qcm' | 'text';
  label: string;
  choices?: string[];
  answers: string[];
  /** Indice pour aider à trouver la réponse en observant (révélé à la demande). */
  hint?: string;
  /** Explication affichée après une bonne réponse. */
  explanation?: string;
};

/** Une image illustrant un élément à découvrir, avec légende optionnelle. */
export type DiscoverImage = {
  /** URL ou chemin local (ex. "photos/detail.jpg" depuis /public). */
  src: string;
  caption?: string;
};

/**
 * Un point d'intérêt à découvrir sur/dans le site. Peut porter :
 * - une ou plusieurs images (avec légende) à observer ;
 * - une simple anecdote (description seule) ;
 * - un quiz d'observation (QCM ou champ libre) à résoudre.
 * Dans tous les cas, une coche "Trouvé / Vu" gamifie la visite.
 */
export type DiscoverItem = {
  id: string;
  title: string;
  images?: DiscoverImage[];
  locationHint?: string;
  description: string;
  question?: DiscoverQuestion;
};

export type Site = {
  id: string;
  name: string;
  category: SiteCategory;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  coverImage: string;
  gallery?: string[];
  shortDescription: string;
  tags: string[];

  /** Anecdote "Le saviez-vous ?" mise en avant. */
  anecdote?: string;

  // ----- Visite / horaires (optionnels : non pertinents pour une statue ou une rue) -----
  openingStatus?: OpeningStatus;
  hours?: WeeklyHours;
  massTimes?: MassTime[]; // uniquement pour les lieux de culte
  openingNotes?: string;
  lastScheduleUpdate?: string;

  access?: AccessInfo;
  history?: History;
  discover?: DiscoverItem[];
};

/** Parcours thématique reliant plusieurs sites. */
export type VisitRoute = {
  id: string;
  title: string;
  description: string;
  duration: string;
  distance: string;
  difficulty: 'easy' | 'medium';
  siteIds: string[];
  tags: string[];
};
