import { useEffect, useRef, useState } from 'react';
import '../styles.css';
import './admin.css';
import type { Site, VisitRoute } from '../types';
import { CATEGORY_META } from '../types';
import { GH_CONFIG, clearToken, getToken, readFile, setToken, whoAmI, writeFile } from '../lib/github';
import { SiteEditor, slugify } from './SiteEditor';
import { RouteEditor } from './RouteEditor';

type Phase = 'auth' | 'loading' | 'ready' | 'error';

const emptySite = (): Site => ({
  id: '',
  name: '',
  category: 'eglise',
  city: '',
  address: '',
  latitude: 50.1754,
  longitude: 3.2362,
  coverImage: '',
  shortDescription: '',
  tags: [],
});

const emptyRoute = (): VisitRoute => ({
  id: '',
  title: '',
  description: '',
  duration: '',
  distance: '',
  difficulty: 'easy',
  siteIds: [],
  tags: [],
});

/** Assure un id stable et unique pour chaque entrée (dérivé du nom si absent). */
function withIds<T extends { id: string }>(list: T[], nameOf: (x: T) => string): T[] {
  const taken = new Set<string>();
  return list.map((x) => {
    let id = x.id || slugify(nameOf(x)) || 'element';
    const base = id;
    let n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;
    taken.add(id);
    return { ...x, id };
  });
}

export function AdminApp() {
  const [token, setTok] = useState(getToken());
  const [tokenInput, setTokenInput] = useState('');
  const [login, setLogin] = useState('');
  const [phase, setPhase] = useState<Phase>(getToken() ? 'loading' : 'auth');
  const [err, setErr] = useState('');

  const [sites, setSites] = useState<Site[]>([]);
  const [routes, setRoutes] = useState<VisitRoute[]>([]);
  const loaded = useRef({ sitesText: '', sitesSha: '', routesText: '', routesSha: '' });

  const [tab, setTab] = useState<'sites' | 'routes'>('sites');
  const [idx, setIdx] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; url?: string } | null>(null);

  async function load(tok: string) {
    setPhase('loading');
    setErr('');
    try {
      const who = await whoAmI(tok);
      const s = await readFile(tok, GH_CONFIG.sitesPath);
      const r = await readFile(tok, GH_CONFIG.routesPath);
      setLogin(who);
      setSites(JSON.parse(s.text));
      setRoutes(JSON.parse(r.text));
      loaded.current = { sitesText: s.text, sitesSha: s.sha, routesText: r.text, routesSha: r.sha };
      setPhase('ready');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }

  useEffect(() => {
    if (token) load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = () => {
    const t = tokenInput.trim();
    if (!t) return;
    setToken(t);
    setTok(t);
    load(t);
  };

  const logout = () => {
    clearToken();
    setTok('');
    setPhase('auth');
    setSites([]);
    setRoutes([]);
  };

  const serialize = () => ({
    sitesText: JSON.stringify(withIds(sites, (s) => s.name), null, 2) + '\n',
    routesText: JSON.stringify(withIds(routes, (r) => r.title), null, 2) + '\n',
  });

  const dirty = phase === 'ready' && (() => {
    const { sitesText, routesText } = serialize();
    return sitesText !== loaded.current.sitesText || routesText !== loaded.current.routesText;
  })();

  async function publish() {
    setPublishing(true);
    setResult(null);
    try {
      const normSites = withIds(sites, (s) => s.name);
      const normRoutes = withIds(routes, (r) => r.title);
      const sitesText = JSON.stringify(normSites, null, 2) + '\n';
      const routesText = JSON.stringify(normRoutes, null, 2) + '\n';
      let url = '';
      let changed = false;

      if (sitesText !== loaded.current.sitesText) {
        const w = await writeFile(token, GH_CONFIG.sitesPath, sitesText, loaded.current.sitesSha, 'admin: mise à jour des lieux');
        loaded.current.sitesText = sitesText;
        loaded.current.sitesSha = w.sha;
        url = w.commitUrl;
        changed = true;
      }
      if (routesText !== loaded.current.routesText) {
        const w = await writeFile(token, GH_CONFIG.routesPath, routesText, loaded.current.routesSha, 'admin: mise à jour des parcours');
        loaded.current.routesText = routesText;
        loaded.current.routesSha = w.sha;
        url = w.commitUrl || url;
        changed = true;
      }
      setSites(normSites);
      setRoutes(normRoutes);
      setResult(
        changed
          ? { ok: true, msg: 'Publié ! Le site se met à jour dans ~1 minute.', url }
          : { ok: true, msg: 'Aucune modification à publier.' }
      );
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setPublishing(false);
    }
  }

  // ---------------- Écran de connexion ----------------
  if (phase === 'auth' || (phase === 'error' && !token)) {
    return (
      <div className="admin admin--center">
        <div className="admin-login">
          <h1>Back-office · Patrimoine du Cambrésis</h1>
          <p>Connecte-toi avec un jeton d’accès GitHub personnel pour modifier les données.</p>
          <input
            type="password"
            placeholder="github_pat_…"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connect()}
          />
          <button className="btn" onClick={connect}>
            Se connecter
          </button>
          {err && <p className="admin-err">{err}</p>}
          <details className="admin-help">
            <summary>Comment créer mon jeton ? (1 fois, ~3 min)</summary>
            <ol>
              <li>
                Va sur{' '}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                  github.com/settings/personal-access-tokens/new
                </a>
                .
              </li>
              <li>Donne-lui un nom, une expiration (ex. 1 an).</li>
              <li>
                <strong>Repository access</strong> → « Only select repositories » → choisis{' '}
                <code>{GH_CONFIG.owner}/{GH_CONFIG.repo}</code>.
              </li>
              <li>
                <strong>Permissions</strong> → Repository permissions → <strong>Contents</strong> → « Read and
                write ».
              </li>
              <li>« Generate token », copie-le, et colle-le ci-dessus.</li>
            </ol>
            <p>Le jeton reste sur ton appareil (navigateur). Il n’est envoyé qu’à GitHub.</p>
          </details>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return <div className="admin admin--center">Chargement des données…</div>;
  }

  if (phase === 'error') {
    return (
      <div className="admin admin--center">
        <div className="admin-login">
          <p className="admin-err">Erreur : {err}</p>
          <button className="btn" onClick={() => load(token)}>Réessayer</button>
          <button className="btn btn--ghost" onClick={logout}>Changer de jeton</button>
        </div>
      </div>
    );
  }

  // ---------------- Interface principale ----------------
  const list = tab === 'sites' ? sites : routes;

  return (
    <div className="admin">
      <header className="admin-bar">
        <div>
          <strong>Back-office</strong> <span className="muted">· {login}</span>
        </div>
        <div className="admin-bar__actions">
          <a className="btn btn--ghost" href="#">Voir le site</a>
          <button className="btn" onClick={publish} disabled={publishing || !dirty}>
            {publishing ? 'Publication…' : dirty ? 'Publier' : 'À jour'}
          </button>
          <button className="btn btn--ghost" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      {result && (
        <div className={`admin-result ${result.ok ? 'ok' : 'ko'}`}>
          {result.msg}{' '}
          {result.url && (
            <a href={result.url} target="_blank" rel="noreferrer">
              voir le commit
            </a>
          )}
        </div>
      )}

      <div className="admin-tabs">
        <button className={tab === 'sites' ? 'on' : ''} onClick={() => { setTab('sites'); setIdx(null); }}>
          Lieux ({sites.length})
        </button>
        <button className={tab === 'routes' ? 'on' : ''} onClick={() => { setTab('routes'); setIdx(null); }}>
          Parcours ({routes.length})
        </button>
      </div>

      {idx === null ? (
        <div className="admin-list">
          <button
            className="btn admin-add"
            onClick={() => {
              if (tab === 'sites') {
                setSites([...sites, emptySite()]);
                setIdx(sites.length);
              } else {
                setRoutes([...routes, emptyRoute()]);
                setIdx(routes.length);
              }
            }}
          >
            ＋ {tab === 'sites' ? 'Nouveau lieu' : 'Nouveau parcours'}
          </button>
          <ul>
            {list.map((it, i) => (
              <li key={i}>
                <button className="admin-item" onClick={() => setIdx(i)}>
                  {tab === 'sites'
                    ? `${CATEGORY_META[(it as Site).category].emoji} ${(it as Site).name || '(sans nom)'} — ${(it as Site).city}`
                    : `🧭 ${(it as VisitRoute).title || '(sans titre)'} · ${(it as VisitRoute).siteIds.length} étapes`}
                </button>
                <button
                  className="af__del"
                  onClick={() => {
                    if (!confirm('Supprimer définitivement cet élément ?')) return;
                    if (tab === 'sites') setSites(sites.filter((_, j) => j !== i));
                    else setRoutes(routes.filter((_, j) => j !== i));
                  }}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="admin-editor">
          <button className="btn btn--ghost admin-back" onClick={() => setIdx(null)}>
            ← Retour à la liste
          </button>
          {tab === 'sites' && sites[idx] && (
            <SiteEditor site={sites[idx]} onChange={(s) => setSites(sites.map((x, j) => (j === idx ? s : x)))} />
          )}
          {tab === 'routes' && routes[idx] && (
            <RouteEditor
              route={routes[idx]}
              sites={sites}
              onChange={(r) => setRoutes(routes.map((x, j) => (j === idx ? r : x)))}
            />
          )}
        </div>
      )}
    </div>
  );
}
