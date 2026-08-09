import { session } from 'electron';
import https from 'https';
import settingsManager from './settings-manager';

/**
 * Bekannte Werbe-Domains. Nicht vollständig (keine EasyList-Parität),
 * deckt aber die häufigsten Ad-Netzwerke ab.
 */
const AD_DOMAINS: string[] = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'amazon-adsystem.com',
  'adnxs.com',
  'adform.net',
  'adroll.com',
  'criteo.com',
  'criteo.net',
  'outbrain.com',
  'taboola.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'moatads.com',
  'media.net',
  'bidswitch.net',
  'contextweb.com',
  'casalemedia.com',
  'smartadserver.com',
  'yieldmo.com',
  'sharethrough.com',
  'ads.yahoo.com',
  'advertising.com',
  'adsrvr.org',
];

/**
 * Bekannte Tracking-/Analytics-Domains, getrennt von Ads, damit sich beides
 * unabhängig voneinander an-/abschalten lässt.
 */
const TRACKER_DOMAINS: string[] = [
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'connect.facebook.net',
  'facebook.com/tr',
  'an.facebook.com',
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'amplitude.com',
  'fullstory.com',
  'mouseflow.com',
  'crazyegg.com',
  'clicktale.net',
  'appsflyer.com',
  'adjust.com',
  'branch.io',
];

/**
 * CSS-Regeln für kosmetische Filter: blendet übliche (oft leere) Werbe-
 * Container aus, auch wenn das eigentliche Skript nicht über obige Domains
 * lief. Bewusst moderat gehalten, um False Positives zu vermeiden.
 */
export const COSMETIC_CSS = `
  .ad, .ads, .advert, .advertisement, .sponsored-content, .sponsor-content,
  [class*="ad-container"], [class*="ad-slot"], [class*="ad-banner"], [class*="ad-wrapper"],
  [id*="google_ads"], [id^="div-gpt-ad"], .adsbygoogle,
  iframe[src*="doubleclick.net"], iframe[src*="googlesyndication.com"],
  .taboola, #taboola-below-article, .outbrain, #outbrain_widget,
  [data-ad-slot], [data-ad-client], .ad-placeholder, .banner-ad
  { display: none !important; visibility: hidden !important; }
`;

let adBlockEnabled = true;
let trackerBlockEnabled = true;
let cosmeticFiltersEnabled = true;
let malwareBlockEnabled = false; // erst nach Eingabe eines API-Keys sinnvoll aktivierbar
let registered = false;

let whitelist: string[] = [];
let blacklist: string[] = [];

const blockedCounts = { ads: 0, trackers: 0, malware: 0 };

function matchesDomain(url: string, list: string[]): boolean {
  return list.some((domain) => url.includes(domain));
}

/**
 * Präziser Hostname-Abgleich für Whitelist/Blacklist (im Gegensatz zum losen
 * includes() der eingebauten Listen) - "beispiel.de" matcht auch
 * "cdn.beispiel.de", aber nicht "beispiel.de.evil.com".
 */
function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function hostnameMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function isWhitelisted(url: string): boolean {
  const hostname = getHostname(url);
  if (!hostname) return false;
  return whitelist.some((domain) => hostnameMatches(hostname, domain));
}

function isBlacklisted(url: string): boolean {
  const hostname = getHostname(url);
  if (!hostname) return false;
  return blacklist.some((domain) => hostnameMatches(hostname, domain));
}

function normalizeDomain(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  const hostOnly = withoutProtocol.split('/')[0];
  return hostOnly.replace(/^www\./, '');
}

/**
 * Registriert den netzwerkbasierten Blocker einmalig auf der Default-Session.
 * Webviews nutzen diese Session standardmäßig mit (kein eigenes partition-
 * Attribut gesetzt). Ein/Aus-Umschalten passiert danach nur noch über die
 * Modul-Variablen, ohne den Listener neu zu registrieren.
 */
export function registerAdBlocker(): void {
  if (registered) return;
  registered = true;

  adBlockEnabled = settingsManager.getAdBlockEnabled();
  trackerBlockEnabled = settingsManager.getTrackerBlockEnabled();
  cosmeticFiltersEnabled = settingsManager.getCosmeticFiltersEnabled();
  malwareBlockEnabled = settingsManager.getMalwareBlockEnabled();
  whitelist = settingsManager.getAdBlockWhitelist();
  blacklist = settingsManager.getAdBlockBlacklist();

  const webRequest = session.defaultSession.webRequest;
  webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    // Whitelist gewinnt immer - auch gegen die Blacklist und die eingebauten Listen.
    if (isWhitelisted(details.url)) {
      callback({ cancel: false });
      return;
    }

    // Blacklist wirkt unabhängig von den Ein/Aus-Schaltern für Werbung/Tracker.
    if (isBlacklisted(details.url)) {
      blockedCounts.ads++;
      callback({ cancel: true });
      return;
    }

    if (adBlockEnabled && matchesDomain(details.url, AD_DOMAINS)) {
      blockedCounts.ads++;
      callback({ cancel: true });
      return;
    }
    if (trackerBlockEnabled && matchesDomain(details.url, TRACKER_DOMAINS)) {
      blockedCounts.trackers++;
      callback({ cancel: true });
      return;
    }
    callback({ cancel: false });
  });
}

export function isUrlWhitelisted(url: string): boolean {
  return isWhitelisted(url);
}

export function getWhitelist(): string[] {
  return [...whitelist];
}

export function addToWhitelist(domainInput: string): string[] {
  const domain = normalizeDomain(domainInput);
  if (domain && !whitelist.includes(domain)) {
    whitelist.push(domain);
    settingsManager.setAdBlockWhitelist(whitelist);
  }
  return [...whitelist];
}

export function removeFromWhitelist(domainInput: string): string[] {
  const domain = normalizeDomain(domainInput);
  whitelist = whitelist.filter((d) => d !== domain);
  settingsManager.setAdBlockWhitelist(whitelist);
  return [...whitelist];
}

export function getBlacklist(): string[] {
  return [...blacklist];
}

export function addToBlacklist(domainInput: string): string[] {
  const domain = normalizeDomain(domainInput);
  if (domain && !blacklist.includes(domain)) {
    blacklist.push(domain);
    settingsManager.setAdBlockBlacklist(blacklist);
  }
  return [...blacklist];
}

export function removeFromBlacklist(domainInput: string): string[] {
  const domain = normalizeDomain(domainInput);
  blacklist = blacklist.filter((d) => d !== domain);
  settingsManager.setAdBlockBlacklist(blacklist);
  return [...blacklist];
}

export function setAdBlockEnabled(enabled: boolean): void {
  adBlockEnabled = enabled;
  settingsManager.setAdBlockEnabled(enabled);
}

export function setTrackerBlockEnabled(enabled: boolean): void {
  trackerBlockEnabled = enabled;
  settingsManager.setTrackerBlockEnabled(enabled);
}

export function setCosmeticFiltersEnabled(enabled: boolean): void {
  cosmeticFiltersEnabled = enabled;
  settingsManager.setCosmeticFiltersEnabled(enabled);
}

export function isCosmeticFiltersEnabled(): boolean {
  return cosmeticFiltersEnabled;
}

export function setMalwareBlockEnabled(enabled: boolean): void {
  malwareBlockEnabled = enabled;
  settingsManager.setMalwareBlockEnabled(enabled);
}

export function isMalwareBlockEnabled(): boolean {
  return malwareBlockEnabled;
}

export function getBlockedStats() {
  return { ...blockedCounts };
}

export function resetBlockedStats(): void {
  blockedCounts.ads = 0;
  blockedCounts.trackers = 0;
  blockedCounts.malware = 0;
}

/**
 * Prüft eine URL gegen die Google Safe Browsing API (v4, lookup API).
 * Läuft nur, wenn der Schutz aktiviert UND ein API-Key hinterlegt ist -
 * ohne Key wird nichts geprüft (keine vorgetäuschte Sicherheit).
 * https://developers.google.com/safe-browsing/v4/lookup-api
 */
export async function checkUrlSafety(url: string): Promise<boolean> {
  const apiKey = settingsManager.getSafeBrowsingApiKey();
  if (!malwareBlockEnabled || !apiKey || isWhitelisted(url)) return false;

  const body = JSON.stringify({
    client: { clientId: 'wulfy-browser', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'safebrowsing.googleapis.com',
        path: `/v4/threatMatches:find?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 3000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(Boolean(parsed.matches && parsed.matches.length > 0));
          } catch {
            resolve(false);
          }
        });
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

export function recordMalwareBlock(): void {
  blockedCounts.malware++;
}

export function getWarningPageHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Warnung: Gefährliche Seite</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #1a0000; color: #fff; display: flex;
         align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .box { max-width: 480px; text-align: center; padding: 40px; }
  h1 { color: #ff4d4d; font-size: 22px; }
  code { background: #330000; padding: 4px 8px; border-radius: 4px; word-break: break-all; }
</style>
</head>
<body>
  <div class="box">
    <h1>⚠️ Diese Seite wurde blockiert</h1>
    <p>Google Safe Browsing hat <code>${url}</code> als Malware- oder Phishing-Seite eingestuft.</p>
    <p>Wulfy Browser hat den Zugriff aus Sicherheitsgründen verhindert.</p>
  </div>
</body>
</html>`;
}
