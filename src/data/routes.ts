import type { VisitRoute } from '../types';

export const routes: VisitRoute[] = [
  {
    id: 'cambrai-centre-rapide',
    title: 'Cambrai centre — découverte rapide',
    description:
      'Une boucle courte mêlant patrimoine religieux et civil au cœur du centre historique.',
    duration: '1h15',
    distance: '2.1 km',
    difficulty: 'easy',
    siteIds: ['cathedrale-cambrai', 'saint-gery-cambrai', 'maison-espagnole-cambrai', 'beffroi-cambrai', 'statue-fenelon'],
    tags: ['centre-ville'],
  },
  {
    id: 'patrimoine-abbayes',
    title: 'Patrimoine et abbayes',
    description: 'Parcours orienté histoire monastique, de Saint-Géry à l’abbaye de Vaucelles.',
    duration: '3h',
    distance: '18 km',
    difficulty: 'medium',
    siteIds: ['saint-gery-cambrai', 'abbaye-vaucelles'],
    tags: ['abbaye', 'histoire'],
  },
];
