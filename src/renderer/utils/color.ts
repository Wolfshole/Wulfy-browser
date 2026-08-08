/**
 * Hellt (percent > 0) oder verdunkelt (percent < 0) eine Hex-Farbe.
 */
export function shadeColor(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  const amt = Math.round(2.55 * percent);

  const clamp = (v: number) => Math.max(0, Math.min(255, v));

  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0x00ff) + amt);
  const b = clamp((num & 0x0000ff) + amt);

  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

/**
 * Legt eine feste, dezente Abdunkelung über einen CSS background-image Wert
 * (Gradient oder url(...)). Wird an einer zentralen Stelle angewendet, bevor
 * --toolbar-bg-image gesetzt wird, damit das Wallpaper überall im Browser
 * (Toolbar, Tab-Leiste, Panels, interne Seiten) gedämpft und der Text darüber
 * lesbar bleibt - unabhängig davon, ob der jeweilige Bereich noch eine eigene
 * Karten-Fläche hat oder nicht.
 */
export function withDarkOverlay(cssImage: string): string {
  if (!cssImage) return cssImage;
  return `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), ${cssImage}`;
}

/**
 * Wendet die Akzentfarbe als CSS-Variablen an (--accent-color, --accent-hover,
 * --accent-active). Wird sowohl beim App-Start als auch bei Live-Änderung
 * in den Einstellungen aufgerufen.
 *
 * WICHTIG: auf document.body gesetzt, nicht documentElement (<html>) - denn
 * body.dark-mode definiert dieselben Variablen erneut. Eine Custom Property,
 * die auf <html> gesetzt wird, würde von body.dark-mode für alles innerhalb
 * von <body> überschrieben. Auf body selbst gesetzt, gewinnt unsere Variable.
 */
export function applyAccentColor(hex: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  document.body.style.setProperty('--accent-color', hex);
  document.body.style.setProperty('--accent-hover', shadeColor(hex, 12));
  document.body.style.setProperty('--accent-active', shadeColor(hex, -15));
}
