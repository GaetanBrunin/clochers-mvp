import { lazy, Suspense, useEffect, useState } from 'react';
import { App } from './App';

// Le back-office est chargé à la demande (code séparé) : il n'alourdit pas
// l'application principale pour les visiteurs.
const AdminApp = lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })));

const isAdminHash = () => window.location.hash.replace(/^#\/?/, '').toLowerCase().startsWith('admin');

/** Routeur minimal basé sur le hash : #admin → back-office, sinon l'app. */
export function Root() {
  const [admin, setAdmin] = useState(isAdminHash);

  useEffect(() => {
    const onHash = () => setAdmin(isAdminHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (admin) {
    return (
      <Suspense fallback={<div className="admin admin--center">Chargement du back-office…</div>}>
        <AdminApp />
      </Suspense>
    );
  }
  return <App />;
}
