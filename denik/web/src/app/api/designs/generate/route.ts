import { NextRequest, NextResponse } from 'next/server';
import { generatePalette, buildBrandColors, extractColorsFromSvg } from '@/lib/brand/colorExtractor';
import { generateNotebookDesign, generateDesignVariations, DesignStyle } from '@/lib/generation/notebookGenerator';

// POST /api/designs/generate - Generate notebook designs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      brandName,        // e.g., "Airbnb"
      logoSvg,          // SVG string or URL
      primaryColor,     // Hex color like "#FF5A5F" (optional, extracted from logo)
      style,            // Design style preference
      variations = 4,   // Number of variations to generate
    } = body;
    
    // Validate required fields
    if (!brandName) {
      return NextResponse.json(
        { error: 'brandName is required' },
        { status: 400 }
      );
    }
    
    // Extract logo SVG if it's a URL
    let logoContent = logoSvg;
    if (logoSvg && logoSvg.startsWith('http')) {
      try {
        const response = await fetch(logoSvg);
        logoContent = await response.text();
      } catch (e) {
        console.error('Failed to fetch logo:', e);
      }
    }
    
    // Extract primary color from logo if not provided
    let primary = primaryColor;
    if (!primary && logoContent && logoContent.includes('fill=')) {
      const colors = extractColorsFromSvg(logoContent);
      primary = colors[0] || '#FF5A5F';
    }
    primary = primary || '#FF5A5F';
    
    // Generate color palette
    const palette = generatePalette(primary);
    const brandColors = buildBrandColors(primary, palette);
    
    // Generate designs
    let designs;
    if (style && Object.keys(style).length > 0) {
      // Generate specific style
      const design = generateNotebookDesign({
        brandName,
        logoSvg: logoContent || '',
        primaryColor: primary,
        brandColors,
        style: style as DesignStyle,
      });
      designs = [design];
    } else {
      // Generate multiple variations
      designs = generateDesignVariations(
        logoContent || '',
        primary,
        brandColors,
        brandName,
        variations
      );
    }
    
    return NextResponse.json({
      success: true,
      brandName,
      palette: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        complementary: palette.complementary,
        analogous: palette.analogous,
        triadic: palette.triadic,
      },
      designs: designs.map(d => ({
        id: d.id,
        style: d.style,
        front: d.front,
        back: d.back,
        palette: d.palette,
      })),
    });
    
  } catch (error) {
    console.error('[Generate Designs] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// GET /api/designs/generate - Get available styles
export async function GET() {
  return NextResponse.json({
    styles: [
      { id: 'HERO_CENTER', name: 'Hero Center', description: 'Logo centered, clean background' },
      { id: 'SPLIT_VERTICAL', name: 'Split Vertical', description: 'Left/right color split with binding' },
      { id: 'GRADIENT_FADE', name: 'Gradient Fade', description: 'Background gradient from color to white' },
      { id: 'NIGHT_REVERSE', name: 'Night Reverse', description: 'Dark background with light logo' },
      { id: 'GEOMETRIC_PATTERN', name: 'Geometric Pattern', description: 'Repeating shapes overlay' },
      { id: 'EDITORIAL', name: 'Editorial', description: 'Typography-forward magazine style' },
      { id: 'HALFTONE', name: 'Halftone', description: 'Dot pattern effect' },
      { id: 'MINIMAL_FRAME', name: 'Minimal Frame', description: 'Bordered with whitespace' },
    ],
    printSpecs: {
      width: 378,
      height: 594,
      bindingWidth: 15,
      bleed: 3,
      safeMargin: 12,
    },
  });
}
