import type { VisitRoute } from '../types';
import data from './routes.json';

/** Parcours. Source éditable : `routes.json` (back-office `#admin`). */
export const routes = data as unknown as VisitRoute[];
