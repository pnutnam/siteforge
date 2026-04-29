/**
 * Print-Ready Notebook Cover Generator
 * 
 * EXACT SPECIFICATIONS:
 * - Front/Back Cover: 378 x 594 pts (5.25" x 8.25")
 * - Binding: LEFT edge, 15pt wide (spine)
 * - Bleed: 3pt
 * - Safe Margin: 12pt from edges
 */

// Print specifications - EXACT VALUES
export const PRINT_SPECS = {
  width: 378,       // 5.25" * 72pt
  height: 594,      // 8.25" * 72pt
  bleed: 3,          // bleed on all edges
  safeMargin: 12,    // content must stay within
  bindingWidth: 15,  // LEFT edge spine
};

// Design style types
export const DESIGN_STYLES = {
  HERO_CENTER: 'hero_center',
  SPLIT_VERTICAL: 'split_vertical',
  SPLIT_HORIZONTAL: 'split_horizontal',
  GRADIENT_FADE: 'gradient_fade',
  GEOMETRIC_PATTERN: 'geometric_pattern',
  EDITORIAL: 'editorial',
  HALFTONE: 'halftone',
  LAYERED_DEPTH: 'layered_depth',
  MINIMAL_FRAME: 'minimal_frame',
  NIGHT_REVERSE: 'night_reverse',
};

export type DesignStyle = keyof typeof DESIGN_STYLES;

// Brand colors interface
export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  binding?: string;
}

// Complete design output
export interface NotebookDesign {
  id: string;
  style: DesignStyle;
  front: string;
  back: string;
  palette: BrandColors;
  thumbnail?: string; // Base64 PNG preview
}

// Design generation request
export interface DesignRequest {
  brandName: string;
  logoSvg: string;
  primaryColor: string;
  brandColors: BrandColors;
  style: DesignStyle;
  bindingColor?: string;
  layoutConfig?: {
    coverOption: 'full_design' | 'front_only_blank_back';
    spineBorder: boolean;
    spineColor: string;
    spineWidth: number;
    bindingSide: 'left' | 'right';
  };
}

// ============================================
// FRONT COVER TEMPLATES
// ============================================

function generateHeroFront(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, safeMargin, bindingWidth } = PRINT_SPECS;
  const centerX = (width + bindingWidth) / 2;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.primary}"/>
      <stop offset="100%" stop-color="${palette.secondary || palette.primary}"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${palette.background || '#FFFFFF'}"/>
  <!-- Main color block -->
  <rect x="${safeMargin}" y="${safeMargin}" width="${width - safeMargin * 2}" height="${height - safeMargin * 2}" fill="${palette.primary}" rx="3"/>
  <!-- Binding stripe -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.binding || palette.secondary || '#333333'}"/>
  <!-- Logo -->
  <g transform="translate(${centerX - 50}, 150)">${logo}</g>
  <!-- Brand name -->
  <text x="${centerX}" y="340" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="4">${brandName}</text>
  <!-- Product line -->
  <text x="${centerX}" y="520" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.8" letter-spacing="5">COLLECTION</text>
</svg>`;
}

function generateSplitVerticalFront(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  const splitX = bindingWidth + 130;
  const rightCenterX = (splitX + width) / 2;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.binding || palette.secondary || '#333333'}"/>
  <!-- Left panel -->
  <rect x="${bindingWidth}" y="0" width="${splitX - bindingWidth}" height="${height}" fill="${palette.secondary || palette.primary || '#00A699'}"/>
  <!-- Right panel -->
  <rect x="${splitX}" y="0" width="${width - splitX}" height="${height}" fill="${palette.primary || '#FF5A5F'}"/>
  <!-- Divider -->
  <line x1="${splitX}" y1="50" x2="${splitX}" y2="${height - 50}" stroke="white" stroke-width="4" opacity="0.7"/>
  <!-- Logo -->
  <g transform="translate(${bindingWidth + 25}, 160) scale(0.55)">${logo}</g>
  <!-- Brand name -->
  <text x="${rightCenterX}" y="260" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="2">${brandName}</text>
  <!-- Tagline -->
  <text x="${rightCenterX}" y="310" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.8">COLLECTION</text>
</svg>`;
}

function generateGradientFadeFront(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  const centerX = (width + bindingWidth) / 2;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.primary}"/>
      <stop offset="45%" stop-color="${palette.secondary || '#FF8A8A'}"/>
      <stop offset="100%" stop-color="${palette.background || '#FFFFFF'}"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#fadeGrad)"/>
  <!-- Binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.binding || palette.secondary || palette.primary || '#333333'}" opacity="0.9"/>
  <!-- Logo -->
  <g transform="translate(${centerX - 45}, 130) scale(0.65)">${logo}</g>
  <!-- Typography -->
  <text x="${centerX}" y="300" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="4" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${brandName}</text>
  <text x="${centerX}" y="360" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" letter-spacing="6">COLLECTION</text>
</svg>`;
}

function generateNightReverseFront(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  const centerX = (width + bindingWidth) / 2;
  const darkColor = '#0D1B2A';
  const whiteLogo = logo.replace(/fill="[^"]*"/g, 'fill="white"');
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Night background -->
  <rect width="${width}" height="${height}" fill="${darkColor}"/>
  <!-- Accent binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.primary || '#FF5A5F'}"/>
  <!-- White logo -->
  <g transform="translate(${centerX - 50}, 150) scale(0.8)">${whiteLogo}</g>
  <!-- Typography -->
  <text x="${centerX}" y="320" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="6">${brandName}</text>
  <text x="${centerX}" y="380" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.7" letter-spacing="8">COLLECTION</text>
</svg>`;
}

function generateGeometricFront(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${palette.background || '#F5F5F5'}"/>
  <!-- Geometric overlay -->
  <defs>
    <pattern id="geoP" width="25" height="25" patternUnits="userSpaceOnUse">
      <rect width="25" height="25" fill="${palette.primary}" opacity="0.12"/>
      <circle cx="12.5" cy="12.5" r="6" fill="${palette.primary}" opacity="0.2"/>
    </pattern>
  </defs>
  <rect x="${bindingWidth}" y="0" width="${width - bindingWidth}" height="${height}" fill="url(#geoP)"/>
  <!-- Binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.binding || palette.secondary || '#333333'}"/>
  <!-- Logo with shadow -->
  <g transform="translate(${bindingWidth + 45}, 145)">
    <rect x="-6" y="6" width="120" height="75" fill="black" opacity="0.12" rx="6"/>
    <g transform="scale(0.8)">${logo}</g>
  </g>
  <!-- Brand name -->
  <text x="${width * 0.65}" y="280" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="${palette.primary}" text-anchor="middle">${brandName}</text>
  <text x="${width * 0.65}" y="320" font-family="Arial, sans-serif" font-size="11" fill="${palette.text || '#333333'}" text-anchor="middle" letter-spacing="4">COLLECTION</text>
</svg>`;
}

// ============================================
// BACK COVER TEMPLATES
// ============================================

function generateBackHero(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  const contentX = bindingWidth + 45;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Light background -->
  <rect width="${width}" height="${height}" fill="${palette.background || '#FFFFFF'}"/>
  <!-- Binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.binding || palette.secondary || '#333333'}"/>
  <!-- Logo small -->
  <g transform="translate(${bindingWidth + 25}, 65) scale(0.25)">${logo}</g>
  <!-- Brand info -->
  <text x="${(width + bindingWidth) / 2 + 20}" y="95" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${palette.text || '#333333'}" text-anchor="middle">${brandName}</text>
  <!-- Divider -->
  <line x1="${contentX}" y1="125" x2="${width - 40}" y2="125" stroke="${palette.primary}" stroke-width="2"/>
  <!-- Description -->
  <text x="${(width + bindingWidth) / 2 + 20}" y="160" font-family="Arial, sans-serif" font-size="11" fill="#666666" text-anchor="middle">Premium Notebook Collection</text>
  <!-- Barcode area -->
  <rect x="${width / 2 - 45}" y="${height - 95}" width="90" height="40" fill="#EEEEEE" rx="2"/>
  <text x="${width / 2}" y="${height - 68}" font-family="Arial, sans-serif" font-size="8" fill="#AAAAAA" text-anchor="middle">BARCODE</text>
</svg>`;
}

function generateBackSplit(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  const splitX = bindingWidth + 100;
  const rightCenterX = (splitX + width) / 2;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.binding || palette.secondary || '#333333'}"/>
  <!-- Left panel -->
  <rect x="${bindingWidth}" y="0" width="100" height="${height}" fill="${palette.secondary || palette.primary || '#00A699'}"/>
  <!-- Right panel -->
  <rect x="${splitX}" y="0" width="${width - splitX}" height="${height}" fill="${palette.background || '#FFFFFF'}"/>
  <!-- Logo -->
  <g transform="translate(${bindingWidth + 18}, 75) scale(0.22)">${logo}</g>
  <!-- Brand name -->
  <text x="${rightCenterX}" y="135" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${palette.text || '#333333'}" text-anchor="middle">${brandName}</text>
  <text x="${rightCenterX}" y="165" font-family="Arial, sans-serif" font-size="10" fill="#666666" text-anchor="middle">Premium Notebook Collection</text>
  <!-- Divider -->
  <line x1="${splitX}" y1="200" x2="${width - 40}" y2="200" stroke="${palette.primary}" stroke-width="1.5"/>
</svg>`;
}

function generateBackNight(palette: BrandColors, logo: string, brandName: string): string {
  const { width, height, bindingWidth } = PRINT_SPECS;
  const whiteLogo = logo.replace(/fill="[^"]*"/g, 'fill="white"');
  
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <!-- Night background -->
  <rect width="${width}" height="${height}" fill="#0D1B2A"/>
  <!-- Binding -->
  <rect x="0" y="0" width="${bindingWidth}" height="${height}" fill="${palette.primary || '#FF5A5F'}"/>
  <!-- Logo -->
  <g transform="translate(${bindingWidth + 25}, 75) scale(0.22)">${whiteLogo}</g>
  <text x="${width * 0.68}" y="130" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${brandName}</text>
  <!-- Barcode -->
  <rect x="${width / 2 - 50}" y="${height - 110}" width="100" height="45" fill="white" rx="3"/>
</svg>`;
}

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

export function generateNotebookDesign(request: DesignRequest): NotebookDesign {
  const { brandName, logoSvg, brandColors, style, bindingColor, layoutConfig } = request;
  
  // Ensure logo is a string
  const logo = typeof logoSvg === 'string' ? logoSvg : String(logoSvg);
  
  // Layout config with defaults
  const layout = layoutConfig || {
    coverOption: 'full_design',
    spineBorder: false,
    spineColor: '',
    spineWidth: 15,
    bindingSide: 'left',
  };
  
  // Determine binding color
  const bindingCol = bindingColor || layout.spineColor || brandColors.binding || brandColors.secondary || '#333333';
  const spineWidth = layout.spineWidth || 15;
  const bindingSide = layout.bindingSide || 'left';
  
  // Apply spine border if enabled
  const showSpineBorder = layout.spineBorder;
  
  const colors = { ...brandColors, binding: bindingCol };
  
  let front: string;
  let back: string;
  
  switch (style) {
    case 'SPLIT_VERTICAL':
      front = generateSplitVerticalFront(colors, logo, brandName);
      back = generateBackSplit(colors, logo, brandName);
      break;
    case 'GRADIENT_FADE':
      front = generateGradientFadeFront(colors, logo, brandName);
      back = generateBackHero(colors, logo, brandName);
      break;
    case 'NIGHT_REVERSE':
      front = generateNightReverseFront(colors, logo, brandName);
      back = generateBackNight(colors, logo, brandName);
      break;
    case 'GEOMETRIC_PATTERN':
      front = generateGeometricFront(colors, logo, brandName);
      back = generateBackHero(colors, logo, brandName);
      break;
    case 'HERO_CENTER':
    default:
      front = generateHeroFront(colors, logo, brandName);
      back = generateBackHero(colors, logo, brandName);
  }
  
  return {
    id: `design_${Date.now()}`,
    style,
    front,
    back,
    palette: colors,
  };
}

/**
 * Generate multiple style variations
 */
export function generateDesignVariations(
  logoSvg: string,
  primaryColor: string,
  brandColors: BrandColors,
  brandName: string,
  count: number = 4
): NotebookDesign[] {
  const styles: DesignStyle[] = [
    'HERO_CENTER',
    'SPLIT_VERTICAL',
    'GRADIENT_FADE',
    'NIGHT_REVERSE',
    'GEOMETRIC_PATTERN',
  ];
  
  return styles.slice(0, count).map(style => 
    generateNotebookDesign({
      brandName,
      logoSvg,
      primaryColor,
      brandColors,
      style,
    })
  );
}
