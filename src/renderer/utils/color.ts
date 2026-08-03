/**
 * Hellt (percent > 0) oder verdunkelt (percent < 0) eine Hex-Farbe.
 */
export function shadeColor(hex: string, percent: number): string {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  const amt = Math.round(2.55 * percent);

  const clamp = (v: number) => Math.max(0, Math.min(255, v));

  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0x00ff) + amt);
  const b = clamp((num & 0x0000ff) + amt);

  return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

/**
 * Wendet die Akzentfarbe als CSS-Variablen an (--accent-color, --accent-hover,
 * --accent-active). Wird sowohl beim App-Start als auch bei Live-Änderung
 * in den Einstellungen aufgerufen.
 */
export function applyAccentColor(hex: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const root = document.documentElement;
  root.style.setProperty("--accent-color", hex);
  root.style.setProperty("--accent-hover", shadeColor(hex, 12));
  root.style.setProperty("--accent-active", shadeColor(hex, -15));
}
