'use client';

import { useState, useRef } from 'react';
import { Upload, Check, ChevronRight, ChevronLeft, FileImage, Palette, FileText, Sparkles, Loader2, Link as LinkIcon, Plus, X, Wand2, RotateCcw, Circle, Square, Triangle, Hexagon, Diamond, Pentagon, Star, Zap, Waves, Grid3x3, Layout, Box, CircleDot, Minus, Hash, Search, Image as ImageIcon } from 'lucide-react';

interface BrandAnalysis {
  primary_colors: string[];
  secondary_colors: string[];
  detected_fonts: string[];
  visual_vibe: string;
  style_preference: string;
}

interface InspirationItem {
  id: string;
  type: 'image' | 'url';
  content: string;
  preview?: string;
}

interface GeneratedDesign {
  id: string;
  front: string; // Base64 or URL
  back: string;
  style: string;
  selected: boolean;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  file: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: 'geometric', name: 'Geometric', description: 'Abstract shapes, grids, clean lines', file: '/prompts/geometric.md' },
  { id: 'floral', name: 'Floral', description: 'Botanical, organic, nature-inspired', file: '/prompts/floral.md' },
  { id: 'illustrative', name: 'Illustrative', description: 'Hand-drawn, flat art, pop art', file: '/prompts/illustrative.md' },
];

// Extract dominant colors from an image using Canvas
function extractColorsFromImage(imageSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(['#FF4A50', '#FF5A5F', '#FD8A8D', '#FABFC1', '#EFEEEE', '#FFFFFF']);
        return;
      }

      // Use higher resolution for better color detection
      const sampleSize = 300;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const pixels = imageData.data;
      
      // Track ALL colors exactly (no quantization during tracking)
      const colorCounts: Map<string, number> = new Map();
      let validPixels = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3];
        
        // Skip fully transparent pixels
        if (a < 128) continue;
        
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Skip near-white pure background (but keep light brand colors)
        if (r > 250 && g > 250 && b > 250 && r + g + b > 740) continue;
        
        validPixels++;
        
        // Store exact color (no quantization at this stage)
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }

      // Sort by frequency
      const sortedColors = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1]);

      // Group similar colors (within 20 in each channel) and keep the most frequent one
      const representativeColors: { color: string; count: number }[] = [];
      
      for (const [color, count] of sortedColors) {
        // Check if this color is similar to an existing representative
        const existing = representativeColors.find(rep => {
          const rgb = hexToRgb(color);
          const repRgb = hexToRgb(rep.color);
          return Math.abs(rgb.r - repRgb.r) < 20 &&
                 Math.abs(rgb.g - repRgb.g) < 20 &&
                 Math.abs(rgb.b - repRgb.b) < 20;
        });
        
        if (existing) {
          // Add count to existing representative
          existing.count += count;
        } else {
          // Add as new representative
          representativeColors.push({ color, count });
        }
        
        // Stop when we have enough distinct colors
        if (representativeColors.length >= 8) break;
      }

      // Re-sort by combined count
      representativeColors.sort((a, b) => b.count - a.count);

      // Calculate saturation for each color
      const colorsWithMetrics = representativeColors.map(({ color, count }) => {
        const rgb = hexToRgb(color);
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        // Score: frequency matters, but saturated brand colors should rank higher
        const score = count * 0.5 + saturation * count * 0.5;
        return { color, saturation, count, score };
      });

      // Sort by score (brand colors first)
      colorsWithMetrics.sort((a, b) => b.score - a.score);

      const result = colorsWithMetrics.slice(0, 6).map(c => c.color);
      
      resolve(result.length > 0 ? result : ['#FF4A50', '#FF5A5F', '#FD8A8D', '#FABFC1', '#EFEEEE', '#FFFFFF']);
    };
    img.onerror = () => {
      resolve(['#FF4A50', '#FF5A5F', '#FD8A8D', '#FABFC1', '#EFEEEE', '#FFFFFF']);
    };
    img.src = imageSrc;
  });
}

// Get color name from hex - comprehensive color naming
function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  const { r, g, b } = rgb;
  
  // Special cases for common values
  if (r > 250 && g > 250 && b > 250) return 'White';
  if (r < 10 && g < 10 && b < 10) return 'Black';
  if (r === 255 && g === 0 && b === 0) return 'Red';
  if (r === 0 && g === 255 && b === 0) return 'Lime';
  if (r === 0 && g === 0 && b === 255) return 'Blue';
  if (r === 255 && g === 255 && b === 0) return 'Yellow';
  if (r === 255 && g === 0 && b === 255) return 'Magenta';
  if (r === 0 && g === 255 && b === 255) return 'Cyan';
  
  // Calculate HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  
  let h = 0, s = 0;
  const lightness = (max + min) / 2;
  
  if (delta !== 0) {
    s = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / delta + 4) / 6;
    }
  }
  
  const hue = h * 360;
  const sat = s * 100;
  const light = lightness * 100;
  
  // Comprehensive color lookup with variations
  // Format: [hueRange, saturationRange, lightnessRange, baseName, variations]
  const colorMap: [number, number, number, string, string[]][] = [
    // Reds (hue 0-15)
    [0, 80, 30, 'Red', ['Red', 'Fire Red', 'Cherry', 'Crimson', 'Scarlet']],
    [0, 70, 50, 'Coral', ['Coral', 'Coral Red', 'Salmon', 'Tomato']],
    [0, 60, 60, 'Rose', ['Rose', 'Dusty Rose', 'Old Rose', 'Rose Pink']],
    [0, 50, 70, 'Pink', ['Pink', 'Light Pink', 'Blush', 'Bubblegum']],
    
    // Oranges (hue 15-45)
    [20, 80, 50, 'Orange', ['Orange', 'Bright Orange', 'Tangerine', 'Citrus']],
    [25, 70, 45, 'Rust', ['Rust', 'Burnt Orange', 'Copper', 'Terracotta']],
    [30, 50, 60, 'Peach', ['Peach', 'Apricot', 'Cantaloupe', 'Coral Glow']],
    
    // Yellows (hue 45-75)
    [50, 80, 50, 'Gold', ['Gold', 'Golden', 'Amber', 'Honey']],
    [55, 60, 65, 'Yellow', ['Yellow', 'Sunflower', 'Canary', 'Lemon']],
    [45, 40, 80, 'Cream', ['Cream', 'Ivory', 'Champagne', 'Vanilla']],
    
    // Greens (hue 75-150)
    [120, 60, 40, 'Forest', ['Forest', 'Hunter Green', 'Deep Green', 'Evergreen']],
    [130, 50, 50, 'Green', ['Green', 'Emerald', 'Jade', 'Mint']],
    [140, 40, 70, 'Sage', ['Sage', 'Olive', 'Moss', 'Tea Green']],
    [150, 50, 60, 'Teal', ['Teal', 'Seafoam', 'Aqua', 'Aquamarine']],
    
    // Cyans (hue 150-195)
    [180, 60, 50, 'Cyan', ['Cyan', 'Aqua', 'Turquoise', 'Electric Blue']],
    [185, 40, 65, 'Sky', ['Sky Blue', 'Light Blue', 'Ice Blue', 'Powder Blue']],
    [190, 30, 75, 'Azure', ['Azure', 'Baby Blue', 'Celeste', 'Cornflower']],
    
    // Blues (hue 195-270)
    [220, 70, 40, 'Navy', ['Navy', 'Deep Blue', 'Midnight', 'Royal Blue']],
    [225, 60, 55, 'Blue', ['Blue', 'Cobalt', 'Ocean', 'Sapphire']],
    [230, 50, 70, 'Steel', ['Steel Blue', 'Slate', 'Cadet', 'Storm']],
    [235, 40, 80, 'Periwinkle', ['Periwinkle', 'Lavender Blue', 'Twilight', 'Lapis']],
    
    // Purples (hue 270-315)
    [280, 60, 40, 'Purple', ['Purple', 'Violet', 'Grape', 'Plum']],
    [285, 50, 55, 'Indigo', ['Indigo', 'Deep Purple', 'Eggplant', 'Mulberry']],
    [290, 40, 65, 'Lavender', ['Lavender', 'Wisteria', 'Lilac', 'Verbena']],
    [295, 50, 75, 'Violet', ['Violet', 'Orchid', 'Amethyst', 'Fuchsia']],
    
    // Magentas/Pinks (hue 315-345)
    [320, 60, 50, 'Magenta', ['Magenta', 'Hot Pink', 'Fuchsia', 'Cerise']],
    [330, 55, 60, 'Rose Pink', ['Rose Pink', 'Blush', 'Rose Quartz', 'Flamingo']],
    [340, 50, 65, 'Mauve', ['Mauve', 'Dusty Pink', 'Rose Dust', 'Clay']],
    
    // Neutrals
    [0, 5, 90, 'White', ['White', 'Snow', 'Pearl', 'Cotton']],
    [0, 5, 20, 'Black', ['Black', 'Charcoal', 'Jet', 'Onyx']],
    [0, 5, 40, 'Gray', ['Gray', 'Slate', 'Graphite', 'Storm']],
    [0, 5, 60, 'Silver', ['Silver', 'Silver Gray', 'Pewter', 'Zinc']],
    [0, 5, 75, 'Ash', ['Ash Gray', 'Light Gray', 'Cloud', 'Silver Lining']],
  ];
  
  // Find matching color family
  let bestMatch: [number, number, number, string, string[]] | null = null;
  let bestScore = -1;
  
  for (const [hRange, sRange, lRange, name, variations] of colorMap) {
    // Check if hue is in range (with wrap-around for red)
    let hueMatch = false;
    const hDist = Math.abs(hue - hRange);
    if (hRange === 0 && hue > 330) {
      hueMatch = hue > 330 && hue < 15;
    } else if (hRange === 0 && hue < 15) {
      hueMatch = true;
    } else {
      hueMatch = hDist < 20;
    }
    
    const satMatch = sat >= sRange - 20 && sat <= sRange + 20;
    const lightMatch = light >= lRange - 25 && light <= lRange + 25;
    
    if (hueMatch && satMatch && lightMatch) {
      // Score based on how close each metric is
      const hueScore = 1 - Math.min(hDist / 20, 1);
      const satScore = 1 - Math.abs(sat - sRange) / 30;
      const lightScore = 1 - Math.abs(light - lRange) / 30;
      const score = hueScore * 3 + satScore * 2 + lightScore;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = [hRange, sRange, lRange, name, variations];
      }
    }
  }
  
  if (!bestMatch) {
    // Fallback: create name from basic hue/saturation/lightness
    if (sat < 10) {
      if (light < 30) return 'Charcoal';
      if (light < 60) return 'Gray';
      return 'Silver';
    }
    
    if (hue < 30) return light > 60 ? 'Coral' : 'Red';
    if (hue < 60) return 'Orange';
    if (hue < 90) return 'Gold';
    if (hue < 150) return 'Green';
    if (hue < 180) return 'Teal';
    if (hue < 210) return 'Blue';
    if (hue < 270) return 'Navy';
    if (hue < 300) return 'Purple';
    if (hue < 330) return 'Magenta';
    return 'Pink';
  }
  
  const [, , , baseName, variations] = bestMatch;
  
  // Select variation based on saturation and lightness
  let variationIndex = 0;
  
  // Higher saturation = more vibrant name
  if (sat > 70 && light > 50) variationIndex = 1; // "Bright" "Fire" "Hot"
  else if (sat > 60 && light > 50) variationIndex = 2; // "Light" "Pale" "Soft"
  else if (sat < 50 && light > 50) variationIndex = 3; // "Dusty" "Muted" "Faded"
  else if (light < 40) variationIndex = 1; // "Deep" "Dark" "Deep"
  
  // Special Airbnb-like names for coral reds
  if (baseName === 'Coral' || baseName === 'Red') {
    if (light > 55 && sat > 60) return 'Red Shimmer';
    if (light > 50 && sat > 65) return 'Bright Coral';
    if (light > 60) return 'Coral Glow';
    if (sat > 70) return 'Coral Red';
  }
  
  return variations[Math.min(variationIndex, variations.length - 1)];
}

// Get contrasting text color based on YIQ contrast
function getContrastYIQ(hex: string): 'dark' | 'light' {
  const rgb = hexToRgb(hex);
  const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
  return yiq >= 128 ? 'dark' : 'light';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

interface PatternPreferences {
  paletteStyle: string;
  shapes: string[];
  layout: string;
  accent: string;
}

// Layout configuration for notebook design
interface LayoutConfig {
  coverOption: 'full_design' | 'front_only_blank_back';
  spineBorder: boolean;
  spineColor: string;
  spineWidth: number;
  bindingSide: 'left' | 'right';
}

interface PipelineWizardProps {
  onComplete: (brand: {
    client_name: string;
    logo_path: string;
    primary_colors: string[];
    secondary_colors: string[];
    approved_fonts: string[];
    visual_vibe: string;
    style_preference: string;
    artistic_direction: string;
    documents: string[];
    inspirations: InspirationItem[];
    selected_prompts: string[];
    custom_prompt?: string;
    selected_design?: GeneratedDesign;
    refinement_notes?: string;
    pattern_preferences?: PatternPreferences;
    layout_config?: LayoutConfig;
  }) => Promise<void>;
  onCancel: () => void;
}

type WizardStep = 'company' | 'logo' | 'unsplash' | 'colors' | 'inspiration' | 'prompts' | 'generate' | 'select' | 'refine' | 'documents' | 'summary';

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'company', label: 'Brand', icon: <FileImage className="w-4 h-4" /> },
  { id: 'logo', label: 'Logo', icon: <FileImage className="w-4 h-4" /> },
  { id: 'unsplash', label: 'Inspiration', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'colors', label: 'Colors', icon: <Palette className="w-4 h-4" /> },
  { id: 'prompts', label: 'Prompts', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'generate', label: 'Generate', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'select', label: 'Select', icon: <Check className="w-4 h-4" /> },
  { id: 'refine', label: 'Refine', icon: <RotateCcw className="w-4 h-4" /> },
  { id: 'documents', label: 'Docs', icon: <FileText className="w-4 h-4" /> },
  { id: 'summary', label: 'Summary', icon: <Sparkles className="w-4 h-4" /> },
];

// Generate mock notebook cover designs
function generateMockDesigns(primaryColors: string[], count: number): GeneratedDesign[] {
  const styles = ['Minimal', 'Bold', 'Geometric', 'Abstract', 'Modern', 'Classic', 'Playful', 'Professional', 'Elegant', 'Dynamic'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `design-${i}`,
    front: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="550">
        <rect fill="${primaryColors[i % primaryColors.length]}" width="400" height="550"/>
        <rect fill="${primaryColors[(i + 1) % primaryColors.length]}" x="50" y="50" width="300" height="450" rx="10"/>
        <text x="200" y="200" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${styles[i]}</text>
        <text x="200" y="240" text-anchor="middle" fill="white" font-size="14">Cover Design</text>
        <circle cx="200" cy="350" r="60" fill="white" opacity="0.2"/>
      </svg>
    `)}`,
    back: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="550">
        <rect fill="${primaryColors[(i + 1) % primaryColors.length]}" width="400" height="550"/>
        <rect fill="${primaryColors[i % primaryColors.length]}" x="50" y="50" width="300" height="450" rx="10"/>
        <text x="200" y="100" text-anchor="middle" fill="white" font-size="16" font-weight="bold">BACK COVER</text>
        <line x1="100" y1="150" x2="300" y2="150" stroke="white" stroke-width="2"/>
        <text x="200" y="200" text-anchor="middle" fill="white" font-size="12">Brand Identity</text>
        <text x="200" y="230" text-anchor="middle" fill="white" font-size="10">Design ${i + 1}</text>
        <rect x="100" y="400" width="200" height="60" fill="white" opacity="0.1" rx="5"/>
      </svg>
    `)}`,
    style: styles[i],
    selected: false,
  }));
}

export function PipelineWizard({ onComplete, onCancel }: PipelineWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('company');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColors, setPrimaryColors] = useState<string[]>([]);
  const [confirmedColors, setConfirmedColors] = useState<string[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [clientName, setClientName] = useState('');
  const [artisticDirection, setArtisticDirection] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<GeneratedDesign | null>(null);
  const [refinementNotes, setRefinementNotes] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef = useRef<HTMLInputElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);

  // Unsplash state
  const [useUnsplash, setUseUnsplash] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashPage, setUnsplashPage] = useState<1 | 2>(1);
  const [unsplashPhotos, setUnsplashPhotos] = useState<Array<{
    id: string;
    urls: { regular: string; small: string; thumb: string };
    alt_description: string | null;
    color: string | null;
    user: { name: string };
  }>>([]);
  const [selectedUnsplash, setSelectedUnsplash] = useState<Set<string>>(new Set());
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);

  // Pattern and shape selection state
  const [selectedPatterns, setSelectedPatterns] = useState({
    paletteStyle: 'Solid',
    shapes: [] as string[],
    layout: 'center',
    accent: 'minimal',
  });

  // Layout configuration state
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    coverOption: 'full_design',
    spineBorder: false,
    spineColor: '',
    spineWidth: 15,
    bindingSide: 'left',
  });

  // Geometric shapes options
  const GEOMETRIC_SHAPES = [
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'square', name: 'Square', icon: Square },
    { id: 'triangle', name: 'Triangle', icon: Triangle },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
    { id: 'diamond', name: 'Diamond', icon: Diamond },
    { id: 'pentagon', name: 'Pentagon', icon: Pentagon },
    { id: 'star', name: 'Star', icon: Star },
    { id: 'zap', name: 'Zigzag', icon: Zap },
  ];

  // Layout pattern previews (SVG)
  const LAYOUT_PATTERNS = [
    { id: 'center', name: 'Center', preview: '<svg viewBox="0 0 50 50"><rect x="15" y="15" width="20" height="20" fill="#666"/></svg>' },
    { id: 'grid', name: 'Grid', preview: '<svg viewBox="0 0 50 50"><rect x="5" y="5" width="10" height="10" fill="#666"/><rect x="20" y="5" width="10" height="10" fill="#666"/><rect x="35" y="5" width="10" height="10" fill="#666"/><rect x="5" y="20" width="10" height="10" fill="#666"/><rect x="20" y="20" width="10" height="10" fill="#666"/><rect x="35" y="20" width="10" height="10" fill="#666"/></svg>' },
    { id: 'stripes', name: 'Stripes', preview: '<svg viewBox="0 0 50 50"><rect x="0" y="0" width="50" height="8" fill="#666"/><rect x="0" y="12" width="50" height="8" fill="#666"/><rect x="0" y="24" width="50" height="8" fill="#666"/><rect x="0" y="36" width="50" height="8" fill="#666"/></svg>' },
    { id: 'diagonal', name: 'Diagonal', preview: '<svg viewBox="0 0 50 50"><polygon points="0,50 25,50 50,25 50,0 25,0 0,25" fill="#666"/></svg>' },
    { id: 'radial', name: 'Radial', preview: '<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="5" fill="#666"/><circle cx="25" cy="25" r="12" fill="none" stroke="#666" stroke-width="2"/><circle cx="25" cy="25" r="20" fill="none" stroke="#666" stroke-width="2"/></svg>' },
    { id: 'scattered', name: 'Scattered', preview: '<svg viewBox="0 0 50 50"><circle cx="10" cy="15" r="4" fill="#666"/><circle cx="35" cy="10" r="3" fill="#666"/><circle cx="25" cy="30" r="5" fill="#666"/><circle cx="40" cy="40" r="4" fill="#666"/><circle cx="15" cy="40" r="3" fill="#666"/></svg>' },
  ];

  // Accent style options
  const ACCENT_STYLES = [
    { id: 'minimal', name: 'Minimal' },
    { id: 'bold', name: 'Bold' },
    { id: 'organic', name: 'Organic' },
    { id: 'geometric', name: 'Geometric' },
    { id: 'abstract', name: 'Abstract' },
  ];

  // Toggle pattern selection
  const togglePattern = (type: 'shapes' | 'layout' | 'accent', value: string) => {
    setSelectedPatterns(prev => {
      if (type === 'shapes') {
        const shapes = prev.shapes.includes(value)
          ? prev.shapes.filter(s => s !== value)
          : [...prev.shapes, value];
        return { ...prev, shapes };
      } else if (type === 'layout') {
        return { ...prev, layout: prev.layout === value ? '' : value };
      } else {
        return { ...prev, accent: prev.accent === value ? '' : value };
      }
    });
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeLogo = async () => {
    if (!logoFile || !logoPreview) return;
    
    setIsAnalyzing(true);
    
    // Extract colors from the uploaded logo
    const extractedColors = await extractColorsFromImage(logoPreview);
    setPrimaryColors(extractedColors);
    
    setIsAnalyzing(false);
    // Skip directly to unsplash step instead of colors
    setCurrentStep('unsplash');
  };

  const addInspirationUrl = () => {
    if (!inspirationUrl.trim()) return;
    setInspirationItems([
      ...inspirationItems,
      { id: Date.now().toString(), type: 'url', content: inspirationUrl },
    ]);
    setInspirationUrl('');
  };

  const addInspirationFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: InspirationItem[] = files.map(f => ({
      id: Date.now().toString() + Math.random(),
      type: 'image' as const,
      content: f.name,
    }));
    
    newItems.forEach((item, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInspirationItems(prev => 
          prev.map((prevItem, idx) => 
            idx === prev.length - 1 - i ? { ...prevItem, preview: e.target?.result as string } : prevItem
          )
        );
      };
      reader.readAsDataURL(files[i]);
    });
    
    setInspirationItems([...inspirationItems, ...newItems]);
  };

  const removeInspiration = (id: string) => {
    setInspirationItems(inspirationItems.filter(item => item.id !== id));
  };

  const togglePrompt = (promptId: string) => {
    if (selectedPrompts.includes(promptId)) {
      setSelectedPrompts(selectedPrompts.filter(p => p !== promptId));
    } else {
      setSelectedPrompts([...selectedPrompts, promptId]);
    }
  };

  // Unsplash search function
  const searchUnsplash = async () => {
    const query = unsplashQuery.trim() || clientName;
    if (!query) return;
    
    setIsSearchingUnsplash(true);
    try {
      const response = await fetch(`/api/unsplash?q=${encodeURIComponent(query)}&limit=30&page=${unsplashPage}`);
      const data = await response.json();
      setUnsplashPhotos(data.photos || []);
    } catch (error) {
      console.error('Unsplash search failed:', error);
    } finally {
      setIsSearchingUnsplash(false);
    }
  };

  const toggleUnsplashPhoto = (photoId: string) => {
    setSelectedUnsplash(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  // Generate design variations using MiniMax API
  const generateDesigns = async () => {
    setIsGenerating(true);
    setCurrentStep('generate');
    
    try {
      // Build request for MiniMax
      const designStyle = selectedPrompts[0] || 'geometric';
      
      const request = {
        brand: {
          client_name: clientName,
          primary_colors: confirmedColors.length > 0 ? confirmedColors : primaryColors,
          secondary_colors: brandAnalysis?.secondary_colors || ['#F3F4F6', '#1F2937'],
          style_preference: designStyle,
          visual_vibe: brandAnalysis?.visual_vibe || 'modern, professional',
        },
        design: {
          style: designStyle,
          pattern_preferences: selectedPatterns,
        },
        refinement_notes: artisticDirection,
        count: 10,
        use_mock: false, // Set true to use SVG mock generator
      };
      
      // Call generation API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error('Generation failed');
      }
      
      const result = await response.json();
      
      // Convert to GeneratedDesign format
      const designs: GeneratedDesign[] = result.designs.map((d: { id: string; image_url: string; style: string }, i: number) => ({
        id: d.id,
        front: d.image_url,
        back: d.image_url, // For now, same as front
        style: d.style || `Design ${i + 1}`,
        selected: false,
      }));
      
      setGeneratedDesigns(designs);
      console.log(`[Generate] Created ${designs.length} designs via MiniMax (cost: $${result.cost?.toFixed(4)})`);
      
    } catch (error) {
      console.error('[Generate] Error:', error);
      // Fallback to mock designs on error
      const mockDesigns = generateMockDesigns(confirmedColors.length > 0 ? confirmedColors : primaryColors, 10);
      setGeneratedDesigns(mockDesigns);
    } finally {
      setIsGenerating(false);
      setCurrentStep('select');
    }
  };

  const selectDesign = (design: GeneratedDesign) => {
    setGeneratedDesigns(designs => designs.map(d => ({
      ...d,
      selected: d.id === design.id,
    })));
    setSelectedDesign(design);
  };

  const confirmDesign = () => {
    if (!selectedDesign) return;
    setCurrentStep('refine');
  };

  const regenerateDesigns = () => {
    setIsGenerating(true);
    setCurrentStep('generate');
    
    setTimeout(() => {
      const designs = generateMockDesigns(confirmedColors.length > 0 ? confirmedColors : primaryColors, 10);
      setGeneratedDesigns(designs);
      setIsGenerating(false);
      setCurrentStep('select');
    }, 2000);
  };

  const analyzeDocuments = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    
    const analysis: BrandAnalysis = {
      primary_colors: confirmedColors.length > 0 ? confirmedColors : primaryColors,
      secondary_colors: ['#F3F4F6', '#1F2937'],
      detected_fonts: ['Helvetica Neue', 'SF Pro Display'],
      visual_vibe: 'Professional, modern, clean aesthetic with bold accent colors',
      style_preference: 'minimalist',
    };
    
    setBrandAnalysis(analysis);
    
    const promptSelection = selectedPrompts.length > 0
      ? `\n\n**Prompt Templates:** ${selectedPrompts.join(', ')}`
      : '';

    const selectedStyleInfo = selectedDesign 
      ? `\n\n**Selected Design:** ${selectedDesign.style} style (Front & Back covers)`
      : '';

    const refinementInfo = refinementNotes 
      ? `\n\n**Refinement Notes:** ${refinementNotes}`
      : '';

    const summary = `
Based on your inputs, here's the pipeline configuration:

**Brand Identity:**
${clientName || 'Client'} - ${analysis.visual_vibe}

**Color Palette:**
- Primary: ${analysis.primary_colors.join(', ')}

**Design Configuration:**
- ${selectedDesign?.style || 'Default'} design selected
- Notebook covers: Front and Back included
- ${selectedPrompts.length} prompt template(s) selected
${promptSelection}${selectedStyleInfo}${refinementInfo}

Ready to proceed with high-fidelity rendering?
    `.trim();
    
    setSummaryText(summary);
    setIsAnalyzing(false);
    setCurrentStep('summary');
  };

  const handleSubmit = async () => {
    await onComplete({
      client_name: clientName,
      logo_path: logoPreview || '',
      primary_colors: confirmedColors.length > 0 ? confirmedColors : primaryColors,
      secondary_colors: brandAnalysis?.secondary_colors || [],
      approved_fonts: brandAnalysis?.detected_fonts || [],
      visual_vibe: brandAnalysis?.visual_vibe || '',
      style_preference: brandAnalysis?.style_preference || 'minimalist',
      artistic_direction: artisticDirection,
      documents: [],
      inspirations: inspirationItems,
      selected_prompts: selectedPrompts,
      custom_prompt: customPrompt,
      selected_design: selectedDesign || undefined,
      refinement_notes: refinementNotes,
      // Pattern and shape selections
      pattern_preferences: selectedPatterns,
      layout_config: layoutConfig,
    });
  };

  const goNext = () => {
    if (currentStep === 'logo' && !logoFile) return;
    if (currentStep === 'colors' && confirmedColors.length === 0) return;
    
    if (currentStep === 'colors') {
      setCurrentStep('inspiration');
    } else if (currentStep === 'inspiration') {
      setCurrentStep('prompts');
    } else if (currentStep === 'prompts') {
      generateDesigns(); // Skip to generation
    } else if (currentStep === 'select') {
      confirmDesign();
    } else if (currentStep === 'refine') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      analyzeDocuments();
    } else {
      const idx = currentStepIndex + 1;
      if (idx < STEPS.length) {
        setCurrentStep(STEPS[idx].id);
      }
    }
  };

  const goBack = () => {
    // Special handling for back navigation
    if (currentStep === 'select' || currentStep === 'generate') {
      setCurrentStep('prompts');
    } else if (currentStep === 'refine') {
      setCurrentStep('select');
    } else if (currentStep === 'documents') {
      setCurrentStep('refine');
    } else {
      const idx = currentStepIndex - 1;
      if (idx >= 0) {
        setCurrentStep(STEPS[idx].id);
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden max-w-6xl mx-auto">
      {/* Progress Header */}
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">New Pipeline Wizard</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">Cancel</button>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div className={`
                flex items-center gap-1.5 px-2 py-1 rounded-full text-xs whitespace-nowrap
                ${currentStep === step.id ? 'bg-blue-600 text-white' : 
                  index < currentStepIndex ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}
              `}>
                {index < currentStepIndex ? <Check className="w-3 h-3" /> : step.icon}
                <span>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 min-h-[500px] max-h-[70vh] overflow-y-auto">
        {/* Step 1: Company Name */}
        {currentStep === 'company' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Company Name</h3>
              <p className="text-gray-400 text-sm">Enter the brand name to start your pipeline.</p>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Client / Brand Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg"
                placeholder="e.g., John Deere"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Artistic Direction (optional)</label>
              <textarea
                value={artisticDirection}
                onChange={(e) => setArtisticDirection(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24 resize-none"
                placeholder="Any specific creative direction or inspiration..."
              />
            </div>

            <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
              <p className="text-blue-200 text-sm">
                After entering the company name, you&apos;ll upload the logo and optionally search for inspiration.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Logo Upload */}
        {currentStep === 'logo' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Upload Brand Logo</h3>
              <p className="text-gray-400 text-sm">Upload the client&apos;s primary logo. We&apos;ll extract the color palette automatically.</p>
            </div>

            <div
              onClick={() => logoInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${logoFile ? 'border-green-500 bg-green-900/20' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/50'}
              `}
            >
              <input ref={logoInputRef} type="file" accept="image/*,.svg" onChange={handleLogoUpload} className="hidden" />
              
              {logoPreview ? (
                <div className="space-y-4">
                  <img src={logoPreview} alt="Logo preview" className="max-h-32 mx-auto object-contain" />
                  <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Logo uploaded: {logoFile?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto" />
                  <div>
                    <p className="text-white font-medium">Click to upload logo</p>
                    <p className="text-gray-400 text-sm">SVG, PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Unsplash Inspiration */}
        {currentStep === 'unsplash' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Brand Inspiration from Unsplash</h3>
              <p className="text-gray-400 text-sm">Search for visual inspiration to guide the design direction.</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-3">Do you want to search for inspiration images?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUseUnsplash(true)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    useUnsplash ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Yes, search Unsplash
                </button>
                <button
                  onClick={() => setUseUnsplash(false)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    !useUnsplash ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  No, skip this step
                </button>
              </div>
            </div>

            {useUnsplash && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder={clientName ? `Search for "${clientName}" or enter custom query...` : 'Enter search query...'}
                    />
                  </div>
                  <button
                    onClick={searchUnsplash}
                    disabled={isSearchingUnsplash}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                  >
                    {isSearchingUnsplash ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Search
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Load results:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setUnsplashPage(1); searchUnsplash(); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        unsplashPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Page 1 (first 30)
                    </button>
                    <button
                      onClick={() => { setUnsplashPage(2); searchUnsplash(); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        unsplashPage === 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Page 2 (next 30)
                    </button>
                    <button
                      onClick={async () => {
                        setIsSearchingUnsplash(true);
                        setUnsplashPage(1);
                        const res1 = await fetch(`/api/unsplash?q=${encodeURIComponent(unsplashQuery || clientName)}&limit=30&page=1`);
                        const data1 = await res1.json();
                        setUnsplashPage(2);
                        const res2 = await fetch(`/api/unsplash?q=${encodeURIComponent(unsplashQuery || clientName)}&limit=30&page=2`);
                        const data2 = await res2.json();
                        setUnsplashPhotos([...(data1.photos || []), ...(data2.photos || [])]);
                        setIsSearchingUnsplash(false);
                      }}
                      disabled={isSearchingUnsplash}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium"
                    >
                      Both pages (60)
                    </button>
                  </div>
                </div>

                {unsplashPhotos.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {unsplashPhotos.length} images • {selectedUnsplash.size} selected
                      </p>
                      <p className="text-xs text-gray-500">
                        Click images to select for inspiration
                      </p>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {unsplashPhotos.map((photo) => {
                        const isSelected = selectedUnsplash.has(photo.id);
                        return (
                          <div
                            key={photo.id}
                            onClick={() => toggleUnsplashPhoto(photo.id)}
                            className={`
                              relative cursor-pointer rounded-xl overflow-hidden transition-all
                              ${isSelected ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-gray-800' : 'hover:ring-2 hover:ring-gray-500'}
                            `}
                          >
                            <div className="aspect-square bg-gray-800">
                              <img
                                src={photo.urls.small}
                                alt={photo.alt_description || 'Inspiration'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {photo.color && (
                              <div
                                className="absolute bottom-2 left-2 w-5 h-5 rounded-full border border-white/50"
                                style={{ backgroundColor: photo.color }}
                                title={photo.color}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-center text-xs text-gray-500">
                      Photos provided by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a> (free to use)
                    </div>
                  </>
                )}

                {unsplashPhotos.length === 0 && !isSearchingUnsplash && (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Search for inspiration images above</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: Color Confirmation */}
        {currentStep === 'colors' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Confirm Color Palette</h3>
              <p className="text-gray-400 text-sm">Select the primary brand colors from the extracted palette.</p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {primaryColors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => confirmedColors.includes(color) ? setConfirmedColors(confirmedColors.filter(c => c !== color)) : setConfirmedColors([...confirmedColors, color])}
                  className={`
                    relative flex flex-col items-center justify-center rounded-xl transition-all p-2
                    ${confirmedColors.includes(color) ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-gray-800' : 'hover:scale-105'}
                  `}
                  style={{ backgroundColor: color }}
                >
                  <span className={`text-xs font-medium px-1 py-0.5 rounded ${getContrastYIQ(color) === 'dark' ? 'text-black/80' : 'text-white'} bg-white/30`}>
                    {getColorName(color)}
                  </span>
                  <span className={`text-[10px] font-mono mt-1 ${getContrastYIQ(color) === 'dark' ? 'text-black/60' : 'text-white/70'}`}>
                    {color.toUpperCase()}
                  </span>
                  {confirmedColors.includes(color) && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Selected primary colors:</p>
              {confirmedColors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {confirmedColors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: color }} />
                      <span className="text-white text-sm font-medium">{getColorName(color)}</span>
                      <span className="text-gray-400 text-xs font-mono">{color.toUpperCase()}</span>
                      <button onClick={() => setConfirmedColors(confirmedColors.filter(c => c !== color))} className="text-gray-400 hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-400 text-sm">Click colors above to select primary colors</p>
              )}
            </div>

            {/* Style Patterns & Shapes Section */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-white font-medium mb-4">Style Patterns & Shapes</h4>
              <p className="text-gray-400 text-sm mb-4">Select patterns or shapes to guide the design style for your notebook covers.</p>
              
              <div className="space-y-4">
                {/* Palette Style */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Palette Style</p>
                  <div className="flex gap-2 flex-wrap">
                    {['Solid', 'Gradient', 'Tonal', 'Complementary'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedPatterns(prev => ({ ...prev, paletteStyle: style }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedPatterns.paletteStyle === style 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geometric Shapes */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Geometric Shapes</p>
                  <div className="flex gap-3 flex-wrap">
                    {GEOMETRIC_SHAPES.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => togglePattern('shapes', shape.id)}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                          selectedPatterns.shapes.includes(shape.id)
                            ? 'bg-blue-600 ring-2 ring-blue-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={shape.name}
                      >
                        <shape.icon className="w-6 h-6 text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Patterns */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Layout Pattern</p>
                  <div className="grid grid-cols-4 gap-2">
                    {LAYOUT_PATTERNS.map((pattern) => (
                      <button
                        key={pattern.id}
                        onClick={() => togglePattern('layout', pattern.id)}
                        className={`p-2 rounded-lg text-center transition-colors ${
                          selectedPatterns.layout === pattern.id
                            ? 'bg-blue-600 ring-2 ring-blue-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={pattern.name}
                      >
                        <div className="w-full aspect-square mb-1" dangerouslySetInnerHTML={{ __html: pattern.preview }} />
                        <span className="text-[9px] text-gray-400">{pattern.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Styles */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Accent Style</p>
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => togglePattern('accent', style.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedPatterns.accent === style.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Layout Configuration Section */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-white font-medium mb-4">Layout Configuration</h4>
                <p className="text-gray-400 text-sm mb-4">Configure how the design wraps around the notebook cover.</p>
                
                <div className="space-y-6">
                  {/* Cover Option */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Cover Design Option</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setLayoutConfig(prev => ({ ...prev, coverOption: 'full_design' }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          layoutConfig.coverOption === 'full_design'
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="w-16 h-20 mx-auto mb-2 bg-gray-700 rounded flex items-center justify-center">
                          <svg viewBox="0 0 64 80" className="w-12 h-14">
                            <rect x="0" y="0" width="20" height="80" fill="#4A5568" rx="2"/>
                            <rect x="20" y="0" width="44" height="80" fill="#3182CE"/>
                          </svg>
                        </div>
                        <span className="text-sm text-white font-medium">Full Design</span>
                        <p className="text-xs text-gray-400 mt-1">Design wraps front to back</p>
                      </button>
                      <button
                        onClick={() => setLayoutConfig(prev => ({ ...prev, coverOption: 'front_only_blank_back' }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          layoutConfig.coverOption === 'front_only_blank_back'
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="w-16 h-20 mx-auto mb-2 bg-gray-700 rounded flex items-center justify-center">
                          <svg viewBox="0 0 64 80" className="w-12 h-14">
                            <rect x="0" y="0" width="20" height="80" fill="#4A5568" rx="2"/>
                            <rect x="20" y="0" width="44" height="80" fill="#3182CE"/>
                            <rect x="64" y="0" width="44" height="80" fill="#E2E8F0" rx="2"/>
                          </svg>
                        </div>
                        <span className="text-sm text-white font-medium">Front Only</span>
                        <p className="text-xs text-gray-400 mt-1">Design on front, blank back</p>
                      </button>
                    </div>
                  </div>

                  {/* Spine Border Toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Spine Border</p>
                        <p className="text-xs text-gray-500">Add a decorative border along the spine edge</p>
                      </div>
                      <button
                        onClick={() => setLayoutConfig(prev => ({ ...prev, spineBorder: !prev.spineBorder }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          layoutConfig.spineBorder ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          layoutConfig.spineBorder ? 'translate-x-7' : 'translate-x-1'
                        }`}/>
                      </button>
                    </div>
                  </div>

                  {/* Spine Color */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Spine Color</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setLayoutConfig(prev => ({ ...prev, spineColor: '' }))}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          layoutConfig.spineColor === ''
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Auto
                      </button>
                      {confirmedColors.slice(0, 4).map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setLayoutConfig(prev => ({ ...prev, spineColor: color }))}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            layoutConfig.spineColor === color
                              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      {primaryColors.slice(0, 2).map((color, i) => (
                        !confirmedColors.includes(color) && (
                          <button
                            key={`extra-${i}`}
                            onClick={() => setLayoutConfig(prev => ({ ...prev, spineColor: color }))}
                            className={`w-10 h-10 rounded-lg transition-all ${
                              layoutConfig.spineColor === color
                                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        )
                      ))}
                    </div>
                  </div>

                  {/* Spine Width */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Spine Width: {layoutConfig.spineWidth}pt</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="30"
                        step="1"
                        value={layoutConfig.spineWidth}
                        onChange={(e) => setLayoutConfig(prev => ({ ...prev, spineWidth: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-400 w-12 text-right">{layoutConfig.spineWidth}pt</span>
                    </div>
                  </div>

                  {/* Binding Side */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Binding Side</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLayoutConfig(prev => ({ ...prev, bindingSide: 'left' }))}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          layoutConfig.bindingSide === 'left'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Left Side
                      </button>
                      <button
                        onClick={() => setLayoutConfig(prev => ({ ...prev, bindingSide: 'right' }))}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          layoutConfig.bindingSide === 'right'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Right Side
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Inspiration */}
        {currentStep === 'inspiration' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Add Inspiration</h3>
              <p className="text-gray-400 text-sm">Share design inspiration via URLs or file uploads.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={inspirationUrl}
                onChange={(e) => setInspirationUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInspirationUrl()}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Paste URL (Pinterest, Dribbble, Behance...)"
              />
              <button onClick={addInspirationUrl} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add URL
              </button>
            </div>

            <div onClick={() => inspirationInputRef.current?.click()} className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-700/50 transition-colors">
              <input ref={inspirationInputRef} type="file" accept="image/*" multiple onChange={addInspirationFile} className="hidden" />
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-white font-medium">Upload inspiration images</p>
              <p className="text-gray-400 text-sm">PNG, JPG, WebP</p>
            </div>

            {inspirationItems.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {inspirationItems.map((item) => (
                  <div key={item.id} className="relative group">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    ) : (
                      <div className="w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                        <LinkIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button onClick={() => removeInspiration(item.id)} className="absolute top-2 right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Prompts */}
        {currentStep === 'prompts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Prompt Templates</h3>
              <p className="text-gray-400 text-sm">Select design approaches for notebook cover variations.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {PROMPT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => togglePrompt(template.id)}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${selectedPrompts.includes(template.id)
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{template.name}</span>
                    {selectedPrompts.includes(template.id) && <Check className="w-5 h-5 text-blue-400" />}
                  </div>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Custom Prompt (optional)</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24 resize-none"
                placeholder="Describe specific design directions or logo treatments..."
              />
            </div>
          </div>
        )}

        {/* Step 5: Generating */}
        {currentStep === 'generate' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <Wand2 className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-white font-medium mt-6">Generating 10 Notebook Cover Designs</p>
            <p className="text-gray-400 text-sm mt-2">Creating front and back cover variations...</p>
          </div>
        )}

        {/* Step 6: Select Design */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Select a Design</h3>
              <p className="text-gray-400 text-sm">Click to select your preferred design. Each shows front (left) and back (right) of notebook.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {generatedDesigns.map((design) => (
                <button
                  key={design.id}
                  onClick={() => selectDesign(design)}
                  className={`
                    relative p-2 rounded-xl border-2 transition-all
                    ${design.selected ? 'border-green-500 bg-green-900/30' : 'border-gray-600 hover:border-gray-500'}
                  `}
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <img src={design.front} alt="Front" className="w-full aspect-[3/4] object-cover rounded" />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 rounded">Front</span>
                    </div>
                    <div className="relative flex-1">
                      <img src={design.back} alt="Back" className="w-full aspect-[3/4] object-cover rounded" />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 rounded">Back</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">{design.style}</p>
                  {design.selected && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <button onClick={regenerateDesigns} className="flex items-center gap-2 text-gray-400 hover:text-white">
                <RotateCcw className="w-4 h-4" /> Regenerate Designs
              </button>
              <button
                onClick={confirmDesign}
                disabled={!selectedDesign}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                Confirm Selection <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Refinement */}
        {currentStep === 'refine' && selectedDesign && (
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-4">Selected Design Preview</h3>
                <div className="flex gap-4">
                  <img src={selectedDesign.front} alt="Front" className="w-48 aspect-[3/4] object-cover rounded-xl border border-gray-600" />
                  <img src={selectedDesign.back} alt="Back" className="w-48 aspect-[3/4] object-cover rounded-xl border border-gray-600" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Refinement Instructions</h3>
              <p className="text-gray-400 text-sm mb-4">Add any adjustments or new instructions for the next generation round.</p>
              <textarea
                value={refinementNotes}
                onChange={(e) => setRefinementNotes(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 resize-none"
                placeholder="e.g., 'Make the logo larger', 'Add more white space', 'Use warmer colors', 'Make it more minimalist'..."
              />
            </div>

            <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
              <p className="text-blue-200 text-sm">
                After this step, we&apos;ll regenerate with your refinements and proceed to the next phase.
              </p>
            </div>
          </div>
        )}

        {/* Step 8: Documents */}
        {currentStep === 'documents' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Brand Documents</h3>
              <p className="text-gray-400 text-sm">Upload brand guidelines or style guides (optional).</p>
            </div>

            <div onClick={() => docsInputRef.current?.click()} className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-700/50 transition-colors">
              <input ref={docsInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg" multiple onChange={(e) => setDocuments(Array.from(e.target.files || []))} className="hidden" />
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-medium">Upload documents</p>
              <p className="text-gray-400 text-sm">PDF, DOC, PNG, JPG</p>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-sm">{doc.name}</span>
                    </div>
                    <button onClick={() => setDocuments(documents.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 9: Summary */}
        {currentStep === 'summary' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Pipeline Summary</h3>
              <p className="text-gray-400 text-sm">Review and confirm before starting.</p>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400">Building configuration...</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-900 rounded-xl p-6">
                  <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {summaryText}
                  </pre>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-200">Ready to start</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-gray-900 px-6 py-4 border-t border-gray-700 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStepIndex === 0 || currentStep === 'generate'}
          className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-sm text-gray-400">
          {currentStep === 'generate' ? 'Generating...' : `Step ${currentStepIndex + 1} of ${STEPS.length}`}
        </div>

        {currentStep === 'summary' ? (
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || isGenerating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Start Pipeline
          </button>
        ) : currentStep === 'select' ? (
          <button
            onClick={confirmDesign}
            disabled={!selectedDesign}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Confirm Selection <ChevronRight className="w-4 h-4" />
          </button>
        ) : currentStep === 'company' ? (
          <button
            onClick={() => {
              if (clientName.trim()) setCurrentStep('logo');
            }}
            disabled={!clientName.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : currentStep === 'logo' ? (
          <button
            onClick={analyzeLogo}
            disabled={!logoFile || isAnalyzing || isGenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : currentStep === 'unsplash' ? (
          <button
            onClick={() => {
              if (selectedUnsplash.size > 0) {
                const selectedPhotos = unsplashPhotos.filter(p => selectedUnsplash.has(p.id));
                setInspirationItems(prev => [
                  ...prev,
                  ...selectedPhotos.map(photo => ({
                    id: photo.id,
                    type: 'image' as const,
                    content: photo.urls.regular,
                    preview: photo.urls.small,
                  }))
                ]);
              }
              setCurrentStep('colors');
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={
              (currentStep === 'colors' && confirmedColors.length === 0) ||
              (currentStep === 'inspiration' && isAnalyzing) ||
              isAnalyzing || isGenerating
            }
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}