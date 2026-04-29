/**
 * Color Extraction & Palette Generation
 * 
 * Extracts dominant colors from brand logo and generates
 * all palette variations needed for design generation.
 */

// HSL/RGB conversion utilities
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export interface ExtractedPalette {
  primary: string;
  secondary: string;
  dominant: string;
  accent: string;
  background: string;
  foreground: string;
  complementary: string[];
  analogous: string[];
  triadic: string[];
  tetradic: string[];
  splitComplementary: string[];
}

export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  binding?: string;
}

/**
 * Generate complete palette from a single color
 */
export function generatePalette(hexColor: string): ExtractedPalette {
  const [r, g, b] = hexToRgb(hexColor);
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Generate color harmony variations
  const complementary = hslToRgb((h + 180) % 360, s, l);
  const analogous1 = hslToRgb((h + 30) % 360, s, l);
  const analogous2 = hslToRgb((h - 30 + 360) % 360, s, l);
  const triadic1 = hslToRgb((h + 120) % 360, s, l);
  const triadic2 = hslToRgb((h + 240) % 360, s, l);
  const tetradic1 = hslToRgb((h + 90) % 360, s, l);
  const tetradic2 = hslToRgb((h + 180) % 360, s, l);
  const tetradic3 = hslToRgb((h + 270) % 360, s, l);
  const splitComp1 = hslToRgb((h + 150) % 360, s, l);
  const splitComp2 = hslToRgb((h + 210) % 360, s, l);
  
  // Background determination (light or dark)
  const background = l > 50 ? '#FFFFFF' : '#000000';
  const foreground = l > 50 ? '#000000' : '#FFFFFF';
  
  return {
    primary: hexColor.toUpperCase(),
    secondary: rgbToHex(...hslToRgb(h, Math.min(s + 10, 100), Math.min(l + 10, 100))),
    dominant: rgbToHex(r, g, b),
    accent: rgbToHex(...complementary),
    background,
    foreground,
    complementary: [hexColor.toUpperCase(), rgbToHex(...complementary)],
    analogous: [
      hexColor.toUpperCase(),
      rgbToHex(...analogous1),
      rgbToHex(...analogous2)
    ],
    triadic: [
      hexColor.toUpperCase(),
      rgbToHex(...triadic1),
      rgbToHex(...triadic2)
    ],
    tetradic: [
      hexColor.toUpperCase(),
      rgbToHex(...tetradic1),
      rgbToHex(...tetradic2),
      rgbToHex(...tetradic3)
    ],
    splitComplementary: [
      hexColor.toUpperCase(),
      rgbToHex(...splitComp1),
      rgbToHex(...splitComp2)
    ]
  };
}

/**
 * Get high-contrast color for text overlays
 */
export function getContrastColor(hexColor: string): string {
  const [r, g, b] = hexToRgb(hexColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Check if color is "dark" (for background decisions)
 */
export function isDarkColor(hexColor: string): boolean {
  const [r, g, b] = hexToRgb(hexColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Lighten a color by percentage
 */
export function lightenColor(hexColor: string, percent: number): string {
  const [r, g, b] = hexToRgb(hexColor);
  const factor = percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(r + (255 - r) * factor)),
    Math.min(255, Math.round(g + (255 - g) * factor)),
    Math.min(255, Math.round(b + (255 - b) * factor))
  );
}

/**
 * Darken a color by percentage
 */
export function darkenColor(hexColor: string, percent: number): string {
  const [r, g, b] = hexToRgb(hexColor);
  const factor = percent / 100;
  return rgbToHex(
    Math.round(r * (1 - factor)),
    Math.round(g * (1 - factor)),
    Math.round(b * (1 - factor))
  );
}

/**
 * Build brand colors from palette
 */
export function buildBrandColors(primary: string, palette: ExtractedPalette): BrandColors {
  return {
    primary: palette.primary,
    secondary: palette.complementary[1],
    accent: palette.triadic[1],
    background: palette.background,
    text: palette.foreground,
    binding: darkenColor(primary, 30),
  };
}

/**
 * Extract colors from SVG logo path data (basic approach)
 * Uses the fill colors present in the SVG
 */
export function extractColorsFromSvg(svgString: string): string[] {
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
  const matches = svgString.match(colorRegex) || [];
  // Remove duplicates and return
  return [...new Set(matches.map(c => c.toUpperCase()))];
}
