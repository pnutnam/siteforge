/**
 * MiniMax Integration for Design Generation
 * 
 * Uses MiniMax's image generation API to create brand-compliant
 * notebook cover designs based on user inputs.
 */

const MINIMAX_API_URL = 'https://api.minimax.chat/v1';

interface GenerateRequest {
  brand: {
    client_name: string;
    primary_colors: string[];
    secondary_colors: string[];
    style_preference: string;
    visual_vibe: string;
  };
  design: {
    style: string; // geometric, floral, illustrative, minimal, bold
    pattern_preferences?: {
      paletteStyle: string;
      shapes: string[];
      layout: string;
      accent: string;
    };
  };
  refinement_notes?: string;
  count?: number; // number of variations to generate
}

interface GenerateResponse {
  success: boolean;
  designs: Array<{
    id: string;
    image_url: string; // Base64 data URL
    thumbnail_url?: string;
    prompt: string;
    style: string;
  }>;
  cost: number;
  generation_id: string;
}

// Build prompt from brand inputs
function buildPrompt(request: GenerateRequest): string {
  const { brand, design } = request;
  
  // Extract brand colors
  const primaryColor = brand.primary_colors[0] || '#FF5A5F';
  const secondaryColor = brand.secondary_colors[0] || '#222222';
  
  // Build style description
  const styleDescriptions: Record<string, string> = {
    geometric: 'geometric shapes, clean lines, abstract patterns, modern grid layouts',
    floral: 'botanical elements, organic forms, nature-inspired patterns, elegant florals',
    illustrative: 'hand-drawn aesthetic, flat art style, vector illustration, bold graphics',
    minimal: 'minimalist design, clean white space, simple shapes, understated elegance',
    bold: 'vibrant colors, high contrast, strong visual impact, dynamic compositions',
    professional: 'corporate design, clean typography, balanced layout, business aesthetic',
  };
  
  const style = styleDescriptions[design.style] || design.style;
  
  // Add pattern preferences if provided
  let patternAddon = '';
  if (design.pattern_preferences) {
    const pp = design.pattern_preferences;
    if (pp.shapes.length > 0) {
      patternAddon += `, featuring ${pp.shapes.join(', ')}`;
    }
    if (pp.layout) {
      patternAddon += `, arranged in ${pp.layout} layout`;
    }
    if (pp.accent) {
      patternAddon += `, with ${pp.accent} accent styling`;
    }
  }
  
  // Build the prompt
  const prompt = `
    Professional notebook cover design for ${brand.client_name}.
    Primary color: ${primaryColor}, secondary: ${secondaryColor}.
    Style: ${style}${patternAddon}.
    Visual vibe: ${brand.visual_vibe}.
    Include brand name typography.
    High quality, print-ready, 4K resolution, flat design, vector style.
    ${request.refinement_notes ? `Refinements: ${request.refinement_notes}` : ''}
  `.trim().replace(/\s+/g, ' ');
  
  return prompt;
}

// Call MiniMax API
export async function generateDesigns(
  request: GenerateRequest,
  apiKey: string
): Promise<GenerateResponse> {
  const count = request.count || 4;
  const prompt = buildPrompt(request);
  
  // MiniMax API expects specific format
  const response = await fetch(`${MINIMAX_API_URL}/text2image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'minimax-01',
      prompt: prompt,
      num_images: count,
      width: 1024,
      height: 1440, // 3:4 aspect ratio for notebook
      style: 'high_quality',
      prompt_en: prompt, // English prompt
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MiniMax API error: ${error}`);
  }
  
  const data = await response.json();
  
  // Parse MiniMax response format
  // Note: Actual format may vary, adjust based on API docs
  const designs = (data.images || []).map((img: { image_url?: string; base64?: string; thumbnail_url?: string }, i: number) => ({
    id: `gen_${Date.now()}_${i}`,
    image_url: img.image_url || `data:image/png;base64,${img.base64}`,
    thumbnail_url: img.thumbnail_url || undefined,
    prompt: prompt,
    style: request.design.style,
  }));
  
  return {
    success: true,
    designs,
    cost: (data.usage?.tokens || count * 100) / 1000, // Estimate
    generation_id: data.id || `gen_${Date.now()}`,
  };
}

// Alternative: Use MiniMax's Chat API with vision for design feedback
export async function analyzeDesign(
  imageBase64: string,
  apiKey: string,
  feedback: string
): Promise<{ analysis: string; suggested_improvements: string[] }> {
  const response = await fetch(`${MINIMAX_API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'minimax-01',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this notebook cover design. ${feedback}. Provide specific improvement suggestions.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze design');
  }
  
  const data = await response.json();
  const analysis = data.choices?.[0]?.message?.content || '';
  
  return {
    analysis,
    suggested_improvements: analysis.split('\n').filter(Boolean),
  };
}

// SVG-based fallback generator (when API unavailable)
export function generateMockDesignsFromSVG(
  request: GenerateRequest,
  count: number = 4
): GenerateResponse {
  const { brand, design } = request;
  const primaryColor = brand.primary_colors[0] || '#FF5A5F';
  const secondaryColor = brand.secondary_colors[0] || '#222222';
  
  // Design templates based on style
  const templates = [
    // 1. Geometric grid pattern
    {
      name: 'geometric_grid',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <rect width="400" height="550" fill="${secondaryColor}"/>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none"/>
            <path d="M0,20 h40 M20,0 v40" stroke="${primaryColor}" stroke-width="2" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="400" height="550" fill="url(#grid)"/>
        <rect x="40" y="40" width="320" height="470" rx="20" fill="${primaryColor}" opacity="0.9"/>
        <text x="200" y="250" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${brand.client_name}</text>
        <text x="200" y="290" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.8">NOTEBOOK</text>
      </svg>`
    },
    // 2. Gradient with shapes
    {
      name: 'gradient_shapes',
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
        <text x="200" y="280" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${brand.client_name}</text>
      </svg>`
    },
    // 3. Stripes pattern
    {
      name: 'stripes',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <rect width="400" height="550" fill="${primaryColor}"/>
        ${Array.from({length: 12}, (_, i) => 
          `<rect x="${i * 35 - 20}" y="0" width="15" height="550" fill="${secondaryColor}" opacity="${0.1 + i * 0.02}"/>`
        ).join('')}
        <rect x="60" y="150" width="280" height="250" rx="15" fill="white" opacity="0.95"/>
        <text x="200" y="250" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="${secondaryColor}" text-anchor="middle">${brand.client_name}</text>
        <text x="200" y="285" font-family="Arial, sans-serif" font-size="12" fill="${secondaryColor}" text-anchor="middle" opacity="0.7">PREMIUM NOTEBOOK</text>
      </svg>`
    },
    // 4. Minimal centered
    {
      name: 'minimal_center',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <rect width="400" height="550" fill="white"/>
        <rect x="20" y="20" width="360" height="510" fill="${secondaryColor}" opacity="0.05"/>
        <circle cx="200" cy="220" r="80" fill="${primaryColor}" opacity="0.9"/>
        <text x="200" y="340" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${secondaryColor}" text-anchor="middle">${brand.client_name}</text>
        <text x="200" y="370" font-family="Arial, sans-serif" font-size="11" fill="${secondaryColor}" text-anchor="middle" letter-spacing="4" opacity="0.6">NOTEBOOK COLLECTION</text>
      </svg>`
    },
  ];
  
  const designs = templates.slice(0, count).map((template, i) => ({
    id: `svg_${Date.now()}_${i}`,
    image_url: `data:image/svg+xml,${encodeURIComponent(template.svg)}`,
    prompt: `Generated ${design.style} design for ${brand.client_name}`,
    style: design.style,
  }));
  
  return {
    success: true,
    designs,
    cost: 0,
    generation_id: `svg_${Date.now()}`,
  };
}