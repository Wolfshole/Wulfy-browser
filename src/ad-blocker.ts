import { session } from 'electron';
import settingsManager from './settings-manager';

/**
 * Bekannte Werbe-/Tracking-Domains. Nicht vollständig (keine EasyList-Parität),
 * aber deckt die häufigsten Ad-Netzwerke und Tracker ab.
 */
const AD_DOMAINS: string[] = [
  // Google Ads / Analytics
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  // Facebook / Meta
  'connect.facebook.net',
  'facebook.com/tr',
  'an.facebook.com',
  // Amazon
  'amazon-adsystem.com',
  // Verbreitete Ad-Netzwerke
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
  // Tracking / Analytics
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'amplitude.com',
  // Sonstige verbreitete Ad-Server
  'ads.yahoo.com',
  'advertising.com',
  'adsrvr.org',
  'bing.com/ads',
];

let adBlockEnabled = true;
let blockedCount = 0;
let registered = false;

function isAdRequest(url: string): boolean {
  return AD_DOMAINS.some((domain) => url.includes(domain));
}

/**
 * Registriert den Blocker einmalig auf der Default-Session (Webviews nutzen
 * diese Session standardmäßig mit, solange kein eigenes partition-Attribut
 * gesetzt ist). Das Ein/Aus-Umschalten passiert danach nur noch über die
 * adBlockEnabled-Variable, ohne den Listener neu zu registrieren.
 */
export function registerAdBlocker(): void {
  if (registered) return;
  registered = true;

  adBlockEnabled = settingsManager.getAdBlockEnabled();

  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    if (adBlockEnabled && isAdRequest(details.url)) {
      blockedCount++;
      callback({ cancel: true });
      return;
    }
    callback({ cancel: false });
  });
}

export function setAdBlockEnabled(enabled: boolean): void {
  adBlockEnabled = enabled;
  settingsManager.setAdBlockEnabled(enabled);
}

export function getBlockedCount(): number {
  return blockedCount;
}

export function resetBlockedCount(): void {
  blockedCount = 0;
}
