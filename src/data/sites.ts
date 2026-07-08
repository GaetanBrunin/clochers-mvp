import type { Site } from '../types';
import data from './sites.json';

/**
 * Données des sites. La source éditable est `sites.json` (modifiable via le
 * back-office `#admin`). Ce fichier n'est plus qu'un point d'accès typé.
 */
export const sites = data as unknown as Site[];
