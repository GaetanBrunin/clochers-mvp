import { useEffect, useMemo, useState } from 'react';
import { Church, churches } from './data/churches';
import { routes } from './data/routes';
import {
  getProgress,
  markChurchVisited,
  markDiscoverItemFound,
  resetProgress,
  saveChurchNote,
  saveProgress,
  saveQuizAnswer,
  toggleFavorite,
  type Progress
} from './lib/localProgress';

type TabKey = 'carte' | 'liste' | 'parcours' | 'carnet';
type DetailTab = 'infos' | 'histoire' | 'decouvrir' | 'notes';

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const googleDirections = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export function App() {
  const [tab, setTab] = useState<TabKey>('liste');
  const [detailTab, setDetailTab] = useState<DetailTab>('infos');
  const [selectedId, setSelectedId] = useState<string>(churches[0]?.id ?? '');
  const [progress, setProgress] = useState<Progress>(getProgress());
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [unvisitedOnly, setUnvisitedOnly] = useState(false);
  const [importError, setImportError] = useState('');

  const selected = useMemo(() => churches.find((church) => church.id === selectedId) ?? churches[0], [selectedId]);

  const filteredChurches = useMemo(() => {
    return churches.filter((church) => {
      const searchable = `${church.name} ${church.city} ${church.shortDescription}`.toLowerCase();
      if (query && !searchable.includes(query.toLowerCase())) return false;
      if (favoritesOnly && !progress.favoriteChurchIds.includes(church.id)) return false;
      if (unvisitedOnly && progress.visitedChurchIds.includes(church.id)) return false;
      return true;
    });
  }, [favoritesOnly, progress.favoriteChurchIds, progress.visitedChurchIds, query]);

  const stats = {
    visited: progress.visitedChurchIds.length,
    favorites: progress.favoriteChurchIds.length,
    found: progress.foundDiscoverItemIds.length
  };

  const badges = useMemo(() => {
    const list: string[] = [];
    if (stats.visited >= 1) list.push('Première église visitée');
    if (stats.visited >= 3) list.push('3 églises visitées');
    if (stats.found >= 1) list.push('Premier élément trouvé');
    if (stats.found >= 5) list.push('5 éléments découverts');
    if (routes.some((route) => route.churchIds.every((id) => progress.visitedChurchIds.includes(id)))) {
      list.push('Premier parcours terminé');
    }
    return list;
  }, [progress.visitedChurchIds, stats.found, stats.visited]);

  useEffect(() => {
    if (JSON.stringify(progress.badges) !== JSON.stringify(badges)) {
      const updated = { ...progress, badges };
      setProgress(updated);
      saveProgress(updated);
    }
  }, [badges, progress]);

  const updateProgress = (next: Progress) => setProgress(next);

  const isFavorite = selected ? progress.favoriteChurchIds.includes(selected.id) : false;
  const isVisited = selected ? progress.visitedChurchIds.includes(selected.id) : false;

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Clochers MVP</h1>
      </header>

      <main className="content">
        {tab === 'liste' && (
          <section>
            <h2>Liste</h2>
            <div className="filters">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (nom, ville, description)" />
              <label><input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} /> Favoris</label>
              <label><input type="checkbox" checked={unvisitedOnly} onChange={(e) => setUnvisitedOnly(e.target.checked)} /> Non visitées</label>
            </div>
            <div className="split">
              <div>
                {filteredChurches.map((church) => (
                  <button key={church.id} className={`church-row ${selected?.id === church.id ? 'active' : ''}`} onClick={() => setSelectedId(church.id)}>
                    <strong>{church.name}</strong>
                    <span>{church.city}</span>
                  </button>
                ))}
              </div>
              {selected && (
                <ChurchDetail
                  church={selected}
                  detailTab={detailTab}
                  setDetailTab={setDetailTab}
                  progress={progress}
                  onToggleFavorite={() => updateProgress(toggleFavorite(selected.id))}
                  onMarkVisited={() => updateProgress(markChurchVisited(selected.id))}
                  onMarkFound={(itemId) => updateProgress(markDiscoverItemFound(selected.id, itemId))}
                  onSaveQuiz={(itemId, answer, isCorrect) => {
                    updateProgress(saveQuizAnswer(selected.id, itemId, answer, isCorrect));
                    if (isCorrect) updateProgress(markDiscoverItemFound(selected.id, itemId));
                  }}
                  onSaveNote={(note) => updateProgress(saveChurchNote(selected.id, note))}
                  isFavorite={isFavorite}
                  isVisited={isVisited}
                />
              )}
            </div>
          </section>
        )}

        {tab === 'carte' && (
          <section>
            <h2>Carte</h2>
            <p className="muted">Carte Leaflet (OpenStreetMap). Touchez un marqueur pour ouvrir la fiche.</p>
            <LeafletMap onSelect={(churchId) => { setSelectedId(churchId); setTab('liste'); }} />
            <div className="row" style={{ marginTop: 8 }}>
              {churches.map((church) => (
                <button key={church.id} onClick={() => window.open(googleDirections(church.latitude, church.longitude), '_blank')}>
                  Itinéraire {church.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === 'parcours' && (
          <section>
            <h2>Parcours</h2>
            {routes.map((route) => {
              const done = route.churchIds.filter((id) => progress.visitedChurchIds.includes(id)).length;
              return (
                <article key={route.id} className="card">
                  <h3>{route.title}</h3>
                  <p>{route.description}</p>
                  <p>{route.duration} · {route.distance} · Difficulté {route.difficulty === 'easy' ? 'facile' : 'moyenne'}</p>
                  <p>Progression : {done}/{route.churchIds.length}</p>
                  <button onClick={() => { setTab('liste'); setSelectedId(route.churchIds[Math.min(done, route.churchIds.length - 1)]); }}>
                    {done === 0 ? 'Commencer la visite' : 'Continuer la visite'}
                  </button>
                </article>
              );
            })}
          </section>
        )}

        {tab === 'carnet' && (
          <section>
            <h2>Mon carnet</h2>
            <p>{stats.visited} visitées · {stats.favorites} favoris · {stats.found} découvertes</p>
            <h3>Badges</h3>
            <ul>{badges.map((badge) => <li key={badge}>{badge}</li>)}</ul>

            <div className="row">
              <button onClick={() => {
                const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'clochers-progress.json';
                link.click();
              }}>Exporter progression en JSON</button>

              <label className="file-picker">Importer progression
                <input type="file" accept="application/json" onChange={async (e) => {
                  setImportError('');
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = JSON.parse(await file.text());
                    const merged = { ...getProgress(), ...parsed };
                    setProgress(merged);
                    saveProgress(merged);
                  } catch {
                    setImportError('Fichier invalide. Vérifiez le JSON.');
                  }
                }} />
              </label>

              <button className="danger" onClick={() => {
                if (window.confirm('Voulez-vous vraiment réinitialiser votre progression ?')) setProgress(resetProgress());
              }}>Réinitialiser la progression</button>
            </div>
            {importError && <p className="error">{importError}</p>}
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {([
          ['carte', 'Carte'],
          ['liste', 'Liste'],
          ['parcours', 'Parcours'],
          ['carnet', 'Mon carnet']
        ] as [TabKey, string][]).map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}

function ChurchDetail(props: {
  church: Church;
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  progress: Progress;
  onToggleFavorite: () => void;
  onMarkVisited: () => void;
  onMarkFound: (itemId: string) => void;
  onSaveQuiz: (itemId: string, answer: string, isCorrect: boolean) => void;
  onSaveNote: (note: string) => void;
  isFavorite: boolean;
  isVisited: boolean;
}) {
  const { church, detailTab, setDetailTab, progress, onToggleFavorite, onMarkVisited, onMarkFound, onSaveQuiz, onSaveNote, isFavorite, isVisited } = props;

  return (
    <section className="church-detail">
      <img src={church.coverImage} alt={church.name} />
      <h3>{church.name}</h3>
      <p>{church.city} · {church.address}</p>
      <div className="row">
        <button onClick={() => window.open(googleDirections(church.latitude, church.longitude), '_blank')}>Itinéraire</button>
        <button onClick={onToggleFavorite}>{isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
        <button disabled={isVisited} onClick={onMarkVisited}>{isVisited ? 'Déjà visitée' : 'Marquer comme visitée'}</button>
      </div>
      <p className="muted">Statut : {church.openingStatus} · Horaires : {church.openingHours} · Messe : {church.massTimes}</p>

      <div className="tabs">
        <button className={detailTab === 'infos' ? 'active' : ''} onClick={() => setDetailTab('infos')}>Infos</button>
        <button className={detailTab === 'histoire' ? 'active' : ''} onClick={() => setDetailTab('histoire')}>Histoire</button>
        <button className={detailTab === 'decouvrir' ? 'active' : ''} onClick={() => setDetailTab('decouvrir')}>À découvrir</button>
        <button className={detailTab === 'notes' ? 'active' : ''} onClick={() => setDetailTab('notes')}>Notes</button>
      </div>

      {detailTab === 'infos' && <p>{church.shortDescription}</p>}
      {detailTab === 'histoire' && <p>{church.history.foundationDate ?? 'Date inconnue'} · {church.history.shortText}</p>}
      {detailTab === 'decouvrir' && (
        <div>
          {church.discover.length === 0 && <p className="muted">Aucun élément à découvrir pour l’instant.</p>}
          {church.discover.map((item) => {
            const key = `${church.id}:${item.id}`;
            const found = progress.foundDiscoverItemIds.includes(key);
            const state = progress.quizAnswers[key];
            return (
              <article key={item.id} className="card">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <p className="muted">Besoin d’un indice ? {item.locationHint}</p>
                {item.question && <Quiz question={item.question.label} choices={item.question.choices} state={state} onSubmit={(answer) => {
                  const ok = item.question!.answers.some((expected) => normalize(expected) === normalize(answer));
                  onSaveQuiz(item.id, answer, ok);
                }} />}
                <button disabled={found} onClick={() => onMarkFound(item.id)}>{found ? 'Trouvé ! ✅' : 'Trouvé !'}</button>
              </article>
            );
          })}
        </div>
      )}
      {detailTab === 'notes' && (
        <textarea value={progress.churchNotes[church.id] ?? ''} placeholder="Écrire une anecdote personnelle" onChange={(e) => onSaveNote(e.target.value)} />
      )}
    </section>
  );
}

function Quiz({ question, choices, state, onSubmit }: { question: string; choices?: string[]; state?: { answer: string; isCorrect: boolean }; onSubmit: (answer: string) => void }) {
  const [answer, setAnswer] = useState(state?.answer ?? '');
  const canSubmit = answer.trim().length > 0;

  return (
    <div className="quiz-box">
      <p>{question}</p>
      {choices ? (
        <div className="row">
          {choices.map((choice) => <button key={choice} onClick={() => { setAnswer(choice); onSubmit(choice); }}>{choice}</button>)}
        </div>
      ) : (
        <div className="row">
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Votre réponse" />
          <button disabled={!canSubmit} onClick={() => onSubmit(answer)}>Valider</button>
        </div>
      )}
      {state && <p className={state.isCorrect ? 'success' : 'error'}>{state.isCorrect ? 'Bonne réponse' : 'Réessayer'}</p>}
    </div>
  );
}


function LeafletMap({ onSelect }: { onSelect: (churchId: string) => void }) {
  useEffect(() => {
    let disposed = false;
    const mapId = 'leaflet-map';

    const ensureCss = () => {
      if (document.getElementById('leaflet-css')) return;
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    };

    const boot = () => {
      const L = (window as any).L;
      if (!L || disposed) return;
      const map = L.map(mapId, { zoomControl: true }).setView([50.17, 3.24], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      churches.forEach((church) => {
        const marker = L.marker([church.latitude, church.longitude]).addTo(map);
        marker.bindPopup(`<strong>${church.name}</strong><br/>${church.city}`);
        marker.on('click', () => onSelect(church.id));
      });
    };

    ensureCss();
    if ((window as any).L) {
      boot();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = boot;
      document.body.appendChild(script);
    }

    return () => {
      disposed = true;
      const mapNode = document.getElementById(mapId);
      if (mapNode) mapNode.innerHTML = '';
    };
  }, [onSelect]);

  return <div id="leaflet-map" className="leaflet-map" />;
}
