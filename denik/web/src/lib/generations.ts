/**
 * Design Generation Service
 * 
 * Uses available image generation APIs or falls back to
 * pre-generated SVG mock designs from the pi pipeline.
 */

// Map of iteration designs from pi pipeline
export const ITERATION_DESIGNS = [
  // Round 1 - Basic exploration
  { id: 'r1_01', round: 1, name: 'Minimalist Watermark', style: 'minimal', path: '/iterations/r1_01_minimalist_watermark.png' },
  { id: 'r1_02', round: 1, name: 'Diagonal Split', style: 'geometric', path: '/iterations/r1_02_diagonal_split.png' },
  { id: 'r1_03', round: 1, name: 'Circular Frame', style: 'geometric', path: '/iterations/r1_03_circular_frame.png' },
  { id: 'r1_04', round: 1, name: 'Grid Mosaic', style: 'geometric', path: '/iterations/r1_04_grid_mosaic.png' },
  { id: 'r1_05', round: 1, name: 'Typography Heavy', style: 'bold', path: '/iterations/r1_05_typography_heavy.png' },
  { id: 'r1_06', round: 1, name: 'Half and Half', style: 'minimal', path: '/iterations/r1_06_half_and_half.png' },
  { id: 'r1_07', round: 1, name: 'Warm Gradient', style: 'minimal', path: '/iterations/r1_07_warm_gradient_up.png' },
  { id: 'r1_08', round: 1, name: 'Teal Coral Contrast', style: 'bold', path: '/iterations/r1_08_teal_coral_contrast.png' },
  { id: 'r1_09', round: 1, name: 'Dark Luxury', style: 'bold', path: '/iterations/r1_09_dark_luxury.png' },
  { id: 'r1_10', round: 1, name: 'Playful Geometric', style: 'geometric', path: '/iterations/r1_10_playful_geometric.png' },
  
  // Round 2 - Professional
  { id: 'r2_01', round: 2, name: 'Asymmetric Pro', style: 'minimal', path: '/iterations/r2_p2_01_asymmetric_pro.png' },
  { id: 'r2_02', round: 2, name: 'Dark Luxury Pro', style: 'bold', path: '/iterations/r2_p2_02_dark_luxury_pro.png' },
  { id: 'r2_03', round: 2, name: 'Teal Coral Pro', style: 'geometric', path: '/iterations/r2_p2_03_teal_coral_pro.png' },
  { id: 'r2_04', round: 2, name: 'Minimal Elegance', style: 'minimal', path: '/iterations/r2_p2_04_minimal_elegance.png' },
  { id: 'r2_05', round: 2, name: 'Editorial Gradient', style: 'bold', path: '/iterations/r2_p2_05_editorial_gradient.png' },
  
  // Round 4 - Color variations
  { id: 'r4_01', round: 4, name: 'Coral Night', style: 'bold', path: '/iterations/r4_r4_01_coral_night.png' },
  { id: 'r4_02', round: 4, name: 'Teal World', style: 'geometric', path: '/iterations/r4_r4_02_teal_world.png' },
  { id: 'r4_03', round: 4, name: 'Dark Sophisticated', style: 'bold', path: '/iterations/r4_r4_03_dark_sophisticated.png' },
  { id: 'r4_04', round: 4, name: 'Geometric Intersection', style: 'geometric', path: '/iterations/r4_r4_04_geometric_intersection.png' },
  { id: 'r4_05', round: 4, name: 'Warm Sand', style: 'minimal', path: '/iterations/r4_r4_05_warm_sand.png' },
  
  // Round 8 - Scream aesthetic
  { id: 'r8_01', round: 8, name: 'Maze Energy', style: 'geometric', path: '/iterations/r8_r8_01_maze_energy.png' },
  { id: 'r8_02', round: 8, name: 'Type Attack', style: 'bold', path: '/iterations/r8_r8_02_type_attack.png' },
  { id: 'r8_03', round: 8, name: 'Rule Thirds', style: 'minimal', path: '/iterations/r8_r8_03_rule_thirds.png' },
  { id: 'r8_04', round: 8, name: 'Radiating', style: 'bold', path: '/iterations/r8_r8_04_radiating.png' },
  { id: 'r8_05', round: 8, name: 'Vertical Stacked', style: 'geometric', path: '/iterations/r8_r8_05_vertical_stacked.png' },
  { id: 'r8_06', round: 8, name: 'Diagonal Stripe', style: 'bold', path: '/iterations/r8_r8_06_diagonal_stripe.png' },
  { id: 'r8_07', round: 8, name: 'Watermark Deep', style: 'minimal', path: '/iterations/r8_r8_07_watermark_deep.png' },
  { id: 'r8_08', round: 8, name: 'Halftone Dots', style: 'geometric', path: '/iterations/r8_r8_08_halftone_dots.png' },
  
  // Round 10 - Brand rules established (Best)
  { id: 'r10_01', round: 10, name: 'Rausch Block', style: 'bold', path: '/iterations/r10_r10_01_rausch_block.png' },
  { id: 'r10_02', round: 10, name: 'Hof Dark', style: 'minimal', path: '/iterations/r10_r10_02_hof_dark.png' },
  { id: 'r10_03', round: 10, name: 'Split Zone', style: 'geometric', path: '/iterations/r10_r10_03_split_zone.png' },
  { id: 'r10_04', round: 10, name: 'Maze Pattern', style: 'geometric', path: '/iterations/r10_r10_04_maze_pattern.png' },
  { id: 'r10_05', round: 10, name: 'Radiating Focus', style: 'bold', path: '/iterations/r10_r10_05_radiating.png' },
  { id: 'r10_06', round: 10, name: 'Sand Warmth', style: 'minimal', path: '/iterations/r10_r10_06_sand_warmth.png' },
  { id: 'r10_07', round: 10, name: 'Type Massive', style: 'bold', path: '/iterations/r10_r10_07_type_massive.png' },
  { id: 'r10_08', round: 10, name: 'Halftone', style: 'geometric', path: '/iterations/r10_r10_08_halftone.png' },
  
  // Round 11 - NO BOX (BEST) ⭐
  { id: 'r11_01', round: 11, name: 'Maze No Box', style: 'geometric', path: '/iterations/r11_r11_01_maze_nobox.png', best: true },
  { id: 'r11_02', round: 11, name: 'Rausch Solid', style: 'bold', path: '/iterations/r11_r11_02_rausch_solid.png', best: true },
  { id: 'r11_03', round: 11, name: 'Hof Dark', style: 'minimal', path: '/iterations/r11_r11_03_hof_dark.png', best: true },
  { id: 'r11_04', round: 11, name: 'Teal Focus', style: 'geometric', path: '/iterations/r11_r11_04_teal_focus.png', best: true },
  { id: 'r11_05', round: 11, name: 'Sand Warm', style: 'minimal', path: '/iterations/r11_r11_05_sand_warm.png', best: true },
  { id: 'r11_06', round: 11, name: 'Halftone', style: 'geometric', path: '/iterations/r11_r11_06_halftone.png', best: true },
  { id: 'r11_07', round: 11, name: 'Split Zone', style: 'bold', path: '/iterations/r11_r11_07_split_zone.png', best: true },
  { id: 'r11_08', round: 11, name: 'Diagonal', style: 'geometric', path: '/iterations/r11_r11_08_diagonal.png', best: true },
  
  // Round 14 - Layered complexity
  { id: 'r14_01', round: 14, name: 'Layered Maze', style: 'geometric', path: '/iterations/r14_r14_01_layered_maze.png' },
  { id: 'r14_02', round: 14, name: 'Concentric Depth', style: 'bold', path: '/iterations/r14_r14_02_concentric_depth.png' },
  { id: 'r14_03', round: 14, name: 'Triangle Mesh', style: 'geometric', path: '/iterations/r14_r14_03_triangle_mesh.png' },
  { id: 'r14_04', round: 14, name: 'Wave Lines', style: 'bold', path: '/iterations/r14_r14_04_wave_lines.png' },
  { id: 'r14_05', round: 14, name: 'Grid Overlay', style: 'geometric', path: '/iterations/r14_r14_05_grid_overlay.png' },
  { id: 'r14_06', round: 14, name: 'Radial Burst', style: 'bold', path: '/iterations/r14_r14_06_radial_burst.png' },
  { id: 'r14_07', round: 14, name: 'Hexagon', style: 'geometric', path: '/iterations/r14_r14_07_hexagon.png' },
  { id: 'r14_08', round: 14, name: 'Noise Texture', style: 'abstract', path: '/iterations/r14_r14_08_noise_texture.png' },
  
  // Round 15 - Zone patterns
  { id: 'r15_01', round: 15, name: 'Maze Zone', style: 'geometric', path: '/iterations/r15_r15_01_maze_zone.png' },
  { id: 'r15_02', round: 15, name: 'Circles Zone', style: 'bold', path: '/iterations/r15_r15_02_circles_zone.png' },
  { id: 'r15_03', round: 15, name: 'Diagonal Zone', style: 'geometric', path: '/iterations/r15_r15_03_diagonal_zone.png' },
  { id: 'r15_04', round: 15, name: 'Triangle Zone', style: 'geometric', path: '/iterations/r15_r15_04_triangle_zone.png' },
  { id: 'r15_05', round: 15, name: 'Halftone Corner', style: 'bold', path: '/iterations/r15_r15_05_halftone_corner.png' },
  { id: 'r15_06', round: 15, name: 'Maze Circle', style: 'geometric', path: '/iterations/r15_r15_06_maze_circle.png' },
  { id: 'r15_07', round: 15, name: 'Grid Band', style: 'minimal', path: '/iterations/r15_r15_07_grid_band.png' },
  { id: 'r15_08', round: 15, name: 'Hex Zone', style: 'geometric', path: '/iterations/r15_r15_08_hex_zone.png' },
  
  // Round 16 - Sample inspired (BEST) ⭐
  { id: 'r16_01', round: 16, name: 'Red Warm', style: 'bold', path: '/iterations/r16_r16_01_red_warm.png', best: true },
  { id: 'r16_02', round: 16, name: 'Navy Blue', style: 'geometric', path: '/iterations/r16_r16_02_navy_blue.png', best: true },
  { id: 'r16_03', round: 16, name: 'Black Teal', style: 'minimal', path: '/iterations/r16_r16_03_black_teal.png', best: true },
  { id: 'r16_04', round: 16, name: 'Layered Waves', style: 'bold', path: '/iterations/r16_r16_04_layered_waves.png', best: true },
  { id: 'r16_05', round: 16, name: 'Crosshatch', style: 'geometric', path: '/iterations/r16_r16_05_crosshatch.png', best: true },
  { id: 'r16_06', round: 16, name: 'Circle Grid', style: 'geometric', path: '/iterations/r16_r16_06_circle_grid.png', best: true },
  { id: 'r16_07', round: 16, name: 'Polkadot Layers', style: 'bold', path: '/iterations/r16_r16_07_polkadot_layers.png', best: true },
  { id: 'r16_08', round: 16, name: 'Triangle Mesh', style: 'geometric', path: '/iterations/r16_r16_08_triangle_mesh.png', best: true },
  
  // Round 17 - Wild exploration
  { id: 'r17_01', round: 17, name: 'Wild Maze', style: 'bold', path: '/iterations/r17_r17_01_wild_maze.png' },
  { id: 'r17_02', round: 17, name: 'Electric Burst', style: 'bold', path: '/iterations/r17_r17_02_electric_burst.png' },
  { id: 'r17_03', round: 17, name: 'Flame Zones', style: 'bold', path: '/iterations/r17_r17_03_flame_zones.png' },
  { id: 'r17_04', round: 17, name: 'Chaos Stripes', style: 'bold', path: '/iterations/r17_r17_04_chaos_stripes.png' },
  { id: 'r17_05', round: 17, name: 'Void Circle', style: 'minimal', path: '/iterations/r17_r17_05_void_circle.png' },
  { id: 'r17_06', round: 17, name: 'Neon Grid', style: 'geometric', path: '/iterations/r17_r17_06_neon_grid.png' },
  { id: 'r17_07', round: 17, name: 'Wave Tsunami', style: 'bold', path: '/iterations/r17_r17_07_wave_tsunami.png' },
  { id: 'r17_08', round: 17, name: 'Splatter', style: 'abstract', path: '/iterations/r17_r17_08_splatter.png' },
  
  // Round 18 - Deep exploration (inspired by best patterns from 11 & 16) ⭐
  { id: 'r18_01', round: 18, name: 'Maze Deep', style: 'geometric', path: '/iterations/r18_r18_01_maze_deep.png', best: true },
  { id: 'r18_02', round: 18, name: 'Rausch Burst', style: 'bold', path: '/iterations/r18_r18_02_rausch_burst.png', best: true },
  { id: 'r18_03', round: 18, name: 'Hof Shadow', style: 'minimal', path: '/iterations/r18_r18_03_hof_shadow.png', best: true },
  { id: 'r18_04', round: 18, name: 'Teal Layer', style: 'geometric', path: '/iterations/r18_r18_04_teal_layer.png', best: true },
  { id: 'r18_05', round: 18, name: 'Sand Cross', style: 'minimal', path: '/iterations/r18_r18_05_sand_cross.png', best: true },
  { id: 'r18_06', round: 18, name: 'Halftone Mix', style: 'geometric', path: '/iterations/r18_r18_06_halftone_mix.png', best: true },
  { id: 'r18_07', round: 18, name: 'Split Dark', style: 'bold', path: '/iterations/r18_r18_07_split_dark.png', best: true },
  { id: 'r18_08', round: 18, name: 'Diagonal Wave', style: 'geometric', path: '/iterations/r18_r18_08_diagonal_wave.png', best: true },
];

export interface IterationDesign {
  id: string;
  round: number;
  name: string;
  style: string;
  path: string;
  best?: boolean;
}

export interface GenerateRequest {
  brand: {
    client_name: string;
    primary_colors: string[];
    secondary_colors: string[];
    style_preference: string;
    visual_vibe: string;
  };
  design: {
    style: string;
    pattern_preferences?: {
      paletteStyle: string;
      shapes: string[];
      layout: string;
      accent: string;
    };
  };
  refinement_notes?: string;
  count?: number;
}

export interface GenerateResponse {
  success: boolean;
  designs: Array<{
    id: string;
    image_url: string;
    path?: string; // for pre-generated iterations
    prompt: string;
    style: string;
    round?: number;
  }>;
  cost: number;
  generation_id: string;
  source: 'api' | 'iterations' | 'mock';
}

// Get designs by style
export function getDesignsByStyle(style: string): typeof ITERATION_DESIGNS[0][] {
  return ITERATION_DESIGNS.filter(d => d.style === style);
}

// Get designs by round
export function getDesignsByRound(round: number): IterationDesign[] {
  return ITERATION_DESIGNS.filter(d => d.round === round);
}

// Get best designs (from rounds 11 and 16)
export function getBestDesigns(): IterationDesign[] {
  return ITERATION_DESIGNS.filter(d => d.best);
}

// Generate designs from iterations (no API needed)
export function generateFromIterations(
  request: GenerateRequest,
  count: number = 10
): GenerateResponse {
  const { design } = request;
  const style = design.style || 'geometric';
  
  // Filter by style or get random
  let candidates = style === 'random' 
    ? ITERATION_DESIGNS 
    : ITERATION_DESIGNS.filter(d => d.style === style);
  
  // Shuffle and take count
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  const designs = selected.map(d => ({
    id: d.id,
    image_url: d.path,
    path: d.path,
    prompt: `Iteration ${d.round}: ${d.name} (${d.style} style)`,
    style: d.style,
    round: d.round,
  }));
  
  return {
    success: true,
    designs,
    cost: 0,
    generation_id: `iter_${Date.now()}`,
    source: 'iterations',
  };
}

// Generate mock SVG designs (fallback when no API)
export function generateMockDesigns(
  request: GenerateRequest,
  count: number = 4
): GenerateResponse {
  const { brand, design } = request;
  const primaryColor = brand.primary_colors?.[0] || '#FF5A5F';
  const secondaryColor = brand.secondary_colors?.[0] || '#222222';
  const clientName = brand.client_name || 'Brand';
  
  // SVG design templates
  const templates = [
    // 1. Geometric grid
    {
      style: 'geometric',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <rect width="400" height="550" fill="${secondaryColor}"/>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0,20 h40 M20,0 v40" stroke="${primaryColor}" stroke-width="2" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="400" height="550" fill="url(#grid)"/>
        <rect x="40" y="40" width="320" height="470" rx="20" fill="${primaryColor}" opacity="0.9"/>
        <text x="200" y="250" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${clientName}</text>
        <text x="200" y="290" font-family="Arial" font-size="14" fill="white" text-anchor="middle" opacity="0.8">NOTEBOOK</text>
      </svg>`
    },
    // 2. Gradient shapes
    {
      style: 'bold',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primaryColor}"/>
            <stop offset="100%" stop-color="${secondaryColor}"/>
          </linearGradient>
        </defs>
        <rect width="400" height="550" fill="url(#grad)"/>
        <circle cx="300" cy="150" r="100" fill="white" opacity="0.1"/>
        <circle cx="100" cy="400" r="80" fill="white" opacity="0.08"/>
        <rect x="50" y="200" width="300" height="200" rx="10" fill="white" opacity="0.15"/>
        <text x="200" y="280" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${clientName}</text>
      </svg>`
    },
    // 3. Minimal centered
    {
      style: 'minimal',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <rect width="400" height="550" fill="white"/>
        <circle cx="200" cy="200" r="100" fill="${primaryColor}"/>
        <text x="200" y="350" font-family="Arial" font-size="36" font-weight="bold" fill="${secondaryColor}" text-anchor="middle">${clientName}</text>
        <text x="200" y="385" font-family="Arial" font-size="11" fill="${secondaryColor}" text-anchor="middle" letter-spacing="4" opacity="0.6">NOTEBOOK COLLECTION</text>
      </svg>`
    },
    // 4. Maze pattern
    {
      style: 'geometric',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <defs>
          <pattern id="maze" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="${primaryColor}"/>
            <path d="M0,10 h6 v-6 h8 M10,0 v6" fill="none" stroke="${secondaryColor}" stroke-width="2.5"/>
          </pattern>
        </defs>
        <rect width="400" height="550" fill="${secondaryColor}"/>
        <rect width="400" height="550" fill="url(#maze)"/>
        <text x="200" y="300" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${clientName}</text>
      </svg>`
    },
  ];
  
  const designs = templates.slice(0, count).map((template, i) => ({
    id: `mock_${Date.now()}_${i}`,
    image_url: `data:image/svg+xml,${encodeURIComponent(template.svg)}`,
    prompt: `Generated ${template.style} design for ${clientName}`,
    style: template.style,
  }));
  
  return {
    success: true,
    designs,
    cost: 0,
    generation_id: `mock_${Date.now()}`,
    source: 'mock',
  };
}

// Main generation function with fallback chain
export async function generateDesigns(
  request: GenerateRequest,
  options: { useApi?: boolean; preferIterations?: boolean } = {}
): Promise<GenerateResponse> {
  const { useApi = false, preferIterations = true } = options;
  const count = request.count || 10;
  
  // Strategy 1: Use pre-generated iterations (always available, no cost)
  if (preferIterations) {
    return generateFromIterations(request, count);
  }
  
  // Strategy 2: Use MiniMax API (if configured)
  if (useApi) {
    try {
      const apiKey = process.env.MINIMAX_API_KEY;
      if (apiKey && !apiKey.includes('xxxxx')) {
        // TODO: Implement actual MiniMax API call
        // For now, fall through to mock
      }
    } catch (error) {
      console.error('[Generate] API error, falling back:', error);
    }
  }
  
  // Strategy 3: Generate mock SVGs
  return generateMockDesigns(request, Math.min(count, 4));
}

// Get available rounds
export function getAvailableRounds(): number[] {
  return Array.from(new Set(ITERATION_DESIGNS.map(d => d.round))).sort((a, b) => a - b);
}

// Get round info
export function getRoundInfo(round: number): { count: number; best: number } {
  const designs = getDesignsByRound(round);
  return {
    count: designs.length,
    best: designs.filter(d => d.best).length,
  };
}