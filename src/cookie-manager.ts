import { session } from 'electron';

export interface CookieInfo {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expirationDate?: number;
}

export interface CookieGroup {
  domain: string;
  cookies: CookieInfo[];
}

function cookieUrl(cookie: { domain: string; path: string; secure: boolean }): string {
  const host = cookie.domain.replace(/^\./, '');
  const scheme = cookie.secure ? 'https' : 'http';
  return `${scheme}://${host}${cookie.path}`;
}

/**
 * Alle Cookies der Default-Session abrufen, nach (Basis-)Domain gruppiert
 * und alphabetisch sortiert.
 */
export async function getAllCookiesGrouped(): Promise<CookieGroup[]> {
  const cookies = await session.defaultSession.cookies.get({});
  const map = new Map<string, CookieInfo[]>();

  for (const c of cookies) {
    const domain = (c.domain || '').replace(/^\./, '');
    const info: CookieInfo = {
      name: c.name,
      value: c.value,
      domain: c.domain || '',
      path: c.path || '/',
      secure: Boolean(c.secure),
      httpOnly: Boolean(c.httpOnly),
      expirationDate: c.expirationDate,
    };
    if (!map.has(domain)) map.set(domain, []);
    map.get(domain)!.push(info);
  }

  return Array.from(map.entries())
    .map(([domain, domainCookies]) => ({ domain, cookies: domainCookies }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

export async function deleteCookie(domain: string, path: string, name: string, secure: boolean): Promise<void> {
  const url = cookieUrl({ domain, path, secure });
  await session.defaultSession.cookies.remove(url, name);
}

export async function deleteCookiesForDomain(domain: string): Promise<void> {
  const cookies = await session.defaultSession.cookies.get({ domain });
  await Promise.all(
    cookies.map((c) =>
      session.defaultSession.cookies.remove(
        cookieUrl({ domain: c.domain || '', path: c.path || '/', secure: Boolean(c.secure) }),
        c.name,
      ),
    ),
  );
}

export async function clearAllCookies(): Promise<void> {
  await session.defaultSession.clearStorageData({ storages: ['cookies'] });
}
