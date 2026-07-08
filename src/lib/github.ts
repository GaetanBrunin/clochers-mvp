// Accès au dépôt GitHub depuis le back-office : lecture et écriture de fichiers
// via l'API Contents. Le jeton personnel de l'éditeur est stocké localement
// (localStorage) et n'est jamais envoyé ailleurs qu'à api.github.com.

export const GH_CONFIG = {
  owner: 'GaetanBrunin',
  repo: 'clochers-mvp',
  branch: 'master',
  sitesPath: 'src/data/sites.json',
  routesPath: 'src/data/routes.json',
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
