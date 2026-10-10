// Accès au dépôt GitHub depuis le back-office : lecture et écriture de fichiers
// via l'API Contents. Le jeton personnel de l'éditeur est stocké localement
// (localStorage) et n'est jamais envoyé ailleurs qu'à api.github.com.

export const GH_CONFIG = {
  owner: 'GaetanBrunin',
  repo: 'clochers-mvp',
  branch: 'master',
  sitesPath: 'src/data/sites.json',
  routesPath: 'src/data/routes.json',
  /** Dossier des photos dans le dépôt (copié tel quel à la racine du site au build). */
  photosDir: 'public/photos',
};

const TOKEN_KEY = 'clochers_gh_token';

export const getToken = (): string => localStorage.getItem(TOKEN_KEY) ?? '';
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t.trim());
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// --- Base64 compatible UTF-8 (les accents cassent btoa/atob bruts) ---
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function decodeBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function api(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json()).message ?? '';
    } catch {
      /* ignore */
    }
    throw new Error(`GitHub ${res.status} — ${detail || res.statusText}`);
  }
  return res.json();
}

/** Vérifie le jeton et renvoie le login GitHub. */
export async function whoAmI(token: string): Promise<string> {
  const user = await api(token, 'GET', '/user');
  return user.login as string;
}

export type RepoFile = { text: string; sha: string };

/** Lit un fichier texte du dépôt (dernière version sur la branche). */
export async function readFile(token: string, filePath: string): Promise<RepoFile> {
  const { owner, repo, branch } = GH_CONFIG;
  const data = await api(
    token,
    'GET',
    `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}&t=${Date.now()}`
  );
  return { text: decodeBase64(data.content), sha: data.sha };
}

/** Renvoie le sha d'un fichier s'il existe, sinon null (404). */
async function getShaIfExists(token: string, filePath: string): Promise<string | null> {
  const { owner, repo, branch } = GH_CONFIG;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(filePath)}?ref=${branch}&t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} — ${res.statusText}`);
  const data = await res.json();
  return data.sha as string;
}

// --- Noms de fichiers « propres » pour les photos ---
const slugifyName = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

/** Lit un fichier du navigateur et renvoie son contenu en base64 (sans le préfixe data:). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}

/**
 * Envoie une image dans `public/photos/` du dépôt (commit immédiat) et renvoie le
 * chemin à utiliser dans les données, ex. "photos/eglise-saint-gery.jpg".
 * Le nom est dérivé du fichier d'origine ; en cas de conflit, un suffixe -2, -3… est ajouté.
 */
export async function uploadPhoto(token: string, file: File): Promise<string> {
  const content = await fileToBase64(file);

  const dot = file.name.lastIndexOf('.');
  const rawBase = dot > 0 ? file.name.slice(0, dot) : file.name;
  const rawExt = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
  const ext = (EXT_BY_MIME[file.type] || rawExt || 'jpg').replace(/[^a-z0-9]/g, '');
  const base = slugifyName(rawBase) || 'photo';

  // Cherche un nom libre : photo.jpg, photo-2.jpg, photo-3.jpg…
  let name = `${base}.${ext}`;
  for (let n = 2; n <= 200; n++) {
    const sha = await getShaIfExists(token, `${GH_CONFIG.photosDir}/${name}`);
    if (sha === null) break;
    name = `${base}-${n}.${ext}`;
  }

  const { owner, repo, branch } = GH_CONFIG;
  await api(token, 'PUT', `/repos/${owner}/${repo}/contents/${GH_CONFIG.photosDir}/${name}`, {
    message: `admin: ajout photo ${name}`,
    content,
    branch,
  });

  return `photos/${name}`;
}

/** URL affichable pour une référence d'image (URL http telle quelle, ou chemin `photos/…`
 *  servi directement depuis le dépôt pour une prévisualisation immédiate). */
export function photoPreviewUrl(ref: string): string {
  const r = (ref ?? '').trim();
  if (!r) return '';
  if (/^https?:\/\//i.test(r) || r.startsWith('data:')) return r;
  const { owner, repo, branch } = GH_CONFIG;
  const clean = r.replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/${encodeURI(clean)}`;
}

/** Écrit (commit) un fichier texte dans le dépôt. Renvoie l'URL du commit + le nouveau sha. */
export async function writeFile(
  token: string,
  filePath: string,
  text: string,
  sha: string,
  message: string
): Promise<{ commitUrl: string; sha: string }> {
  const { owner, repo, branch } = GH_CONFIG;
  const data = await api(token, 'PUT', `/repos/${owner}/${repo}/contents/${filePath}`, {
    message,
    content: encodeBase64(text),
    sha,
    branch,
  });
  return { commitUrl: data.commit.html_url as string, sha: data.content.sha as string };
}
