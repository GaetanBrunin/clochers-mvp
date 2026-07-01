import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { sites } from './data/sites';
import { routes } from './data/routes';
import { useProgress } from './hooks/useProgress';
import { SiteList } from './components/SiteList';
import { MapView } from './components/MapView';
import { SiteDetail } from './components/SiteDetail';
import { RoutesView } from './components/RoutesView';
import { CarnetView } from './components/CarnetView';

type Tab = 'liste' | 'carte' | 'parcours' | 'carnet';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'liste', label: 'Liste', icon: '📋' },
  { key: 'carte', label: 'Carte', icon: '🗺️' },
  { key: 'parcours', label: 'Parcours', icon: '🧭' },
  { key: 'carnet', label: 'Carnet', icon: '🎖️' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('liste');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const api = useProgress();
  // Instant de référence pour le calcul "ouvert/fermé", figé par rendu.
  const now = new Date();

  const selected = sites.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Patrimoine du Cambrésis</h1>
        <p>Explorez les églises, monuments et trésors du diocèse de Cambrai</p>
      </header>

      <main className="app__main">
        {tab === 'liste' && <SiteList sites={sites} api={api} now={now} onSelect={setSelectedId} />}
        {tab === 'carte' && <MapView sites={sites} onSelect={setSelectedId} />}
        {tab === 'parcours' && (
          <RoutesView routes={routes} sites={sites} api={api} onSelect={setSelectedId} />
        )}
        {tab === 'carnet' && <CarnetView sites={sites} routes={routes} api={api} />}
      </main>

      <nav className="app__nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'nav-btn nav-btn--on' : 'nav-btn'}
            onClick={() => setTab(t.key)}
          >
            <span className="nav-btn__icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {selected && (
        <SiteDetail site={selected} api={api} now={now} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
