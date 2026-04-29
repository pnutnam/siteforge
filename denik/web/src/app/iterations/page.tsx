'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface IterationDesign {
  name: string;
  path: string;
  round: number;
}

// All iterations from pi directory
const ALL_ITERATIONS = [
  // Round 1 - Basic exploration
  { round: 1, name: '01_minimalist_watermark', path: '/iterations/r1_01_minimalist_watermark.png' },
  { round: 1, name: '02_diagonal_split', path: '/iterations/r1_02_diagonal_split.png' },
  { round: 1, name: '03_circular_frame', path: '/iterations/r1_03_circular_frame.png' },
  { round: 1, name: '04_grid_mosaic', path: '/iterations/r1_04_grid_mosaic.png' },
  { round: 1, name: '05_typography_heavy', path: '/iterations/r1_05_typography_heavy.png' },
  { round: 1, name: '06_half_and_half', path: '/iterations/r1_06_half_and_half.png' },
  { round: 1, name: '07_warm_gradient_up', path: '/iterations/r1_07_warm_gradient_up.png' },
  { round: 1, name: '08_teal_coral_contrast', path: '/iterations/r1_08_teal_coral_contrast.png' },
  { round: 1, name: '09_dark_luxury', path: '/iterations/r1_09_dark_luxury.png' },
  { round: 1, name: '10_playful_geometric', path: '/iterations/r1_10_playful_geometric.png' },
  
  // Round 2 - Professional
  { round: 2, name: 'p2_01_asymmetric_pro', path: '/iterations/r2_p2_01_asymmetric_pro.png' },
  { round: 2, name: 'p2_02_dark_luxury_pro', path: '/iterations/r2_p2_02_dark_luxury_pro.png' },
  { round: 2, name: 'p2_03_teal_coral_pro', path: '/iterations/r2_p2_03_teal_coral_pro.png' },
  { round: 2, name: 'p2_04_minimal_elegance', path: '/iterations/r2_p2_04_minimal_elegance.png' },
  { round: 2, name: 'p2_05_editorial_gradient', path: '/iterations/r2_p2_05_editorial_gradient.png' },
  
  // Round 4 - Color variations
  { round: 4, name: 'r4_01_coral_night', path: '/iterations/r4_r4_01_coral_night.png' },
  { round: 4, name: 'r4_02_teal_world', path: '/iterations/r4_r4_02_teal_world.png' },
  { round: 4, name: 'r4_03_dark_sophisticated', path: '/iterations/r4_r4_03_dark_sophisticated.png' },
  { round: 4, name: 'r4_04_geometric_intersection', path: '/iterations/r4_r4_04_geometric_intersection.png' },
  { round: 4, name: 'r4_05_warm_sand', path: '/iterations/r4_r4_05_warm_sand.png' },
  
  // Round 8 - Scream aesthetic
  { round: 8, name: 'r8_01_maze_energy', path: '/iterations/r8_r8_01_maze_energy.png' },
  { round: 8, name: 'r8_02_type_attack', path: '/iterations/r8_r8_02_type_attack.png' },
  { round: 8, name: 'r8_03_rule_thirds', path: '/iterations/r8_r8_03_rule_thirds.png' },
  { round: 8, name: 'r8_04_radiating', path: '/iterations/r8_r8_04_radiating.png' },
  { round: 8, name: 'r8_05_vertical_stacked', path: '/iterations/r8_r8_05_vertical_stacked.png' },
  { round: 8, name: 'r8_06_diagonal_stripe', path: '/iterations/r8_r8_06_diagonal_stripe.png' },
  { round: 8, name: 'r8_07_watermark_deep', path: '/iterations/r8_r8_07_watermark_deep.png' },
  { round: 8, name: 'r8_08_halftone_dots', path: '/iterations/r8_r8_08_halftone_dots.png' },
  
  // Round 10 - Brand rules established
  { round: 10, name: 'r10_01_rausch_block', path: '/iterations/r10_r10_01_rausch_block.png' },
  { round: 10, name: 'r10_02_hof_dark', path: '/iterations/r10_r10_02_hof_dark.png' },
  { round: 10, name: 'r10_03_split_zone', path: '/iterations/r10_r10_03_split_zone.png' },
  { round: 10, name: 'r10_04_maze_pattern', path: '/iterations/r10_r10_04_maze_pattern.png' },
  { round: 10, name: 'r10_05_radiating', path: '/iterations/r10_r10_05_radiating.png' },
  { round: 10, name: 'r10_06_sand_warmth', path: '/iterations/r10_r10_06_sand_warmth.png' },
  { round: 10, name: 'r10_07_type_massive', path: '/iterations/r10_r10_07_type_massive.png' },
  { round: 10, name: 'r10_08_halftone', path: '/iterations/r10_r10_08_halftone.png' },
  
  // Round 11 - No box (BEST)
  { round: 11, name: 'r11_01_maze_nobox', path: '/iterations/r11_r11_01_maze_nobox.png' },
  { round: 11, name: 'r11_02_rausch_solid', path: '/iterations/r11_r11_02_rausch_solid.png' },
  { round: 11, name: 'r11_03_hof_dark', path: '/iterations/r11_r11_03_hof_dark.png' },
  { round: 11, name: 'r11_04_teal_focus', path: '/iterations/r11_r11_04_teal_focus.png' },
  { round: 11, name: 'r11_05_sand_warm', path: '/iterations/r11_r11_05_sand_warm.png' },
  { round: 11, name: 'r11_06_halftone', path: '/iterations/r11_r11_06_halftone.png' },
  { round: 11, name: 'r11_07_split_zone', path: '/iterations/r11_r11_07_split_zone.png' },
  { round: 11, name: 'r11_08_diagonal', path: '/iterations/r11_r11_08_diagonal.png' },
  
  // Round 14 - Layered complexity
  { round: 14, name: 'r14_01_layered_maze', path: '/iterations/r14_r14_01_layered_maze.png' },
  { round: 14, name: 'r14_02_concentric_depth', path: '/iterations/r14_r14_02_concentric_depth.png' },
  { round: 14, name: 'r14_03_triangle_mesh', path: '/iterations/r14_r14_03_triangle_mesh.png' },
  { round: 14, name: 'r14_04_wave_lines', path: '/iterations/r14_r14_04_wave_lines.png' },
  { round: 14, name: 'r14_05_grid_overlay', path: '/iterations/r14_r14_05_grid_overlay.png' },
  { round: 14, name: 'r14_06_radial_burst', path: '/iterations/r14_r14_06_radial_burst.png' },
  { round: 14, name: 'r14_07_hexagon', path: '/iterations/r14_r14_07_hexagon.png' },
  { round: 14, name: 'r14_08_noise_texture', path: '/iterations/r14_r14_08_noise_texture.png' },
  
  // Round 15 - Zone patterns
  { round: 15, name: 'r15_01_maze_zone', path: '/iterations/r15_r15_01_maze_zone.png' },
  { round: 15, name: 'r15_02_circles_zone', path: '/iterations/r15_r15_02_circles_zone.png' },
  { round: 15, name: 'r15_03_diagonal_zone', path: '/iterations/r15_r15_03_diagonal_zone.png' },
  { round: 15, name: 'r15_04_triangle_zone', path: '/iterations/r15_r15_04_triangle_zone.png' },
  { round: 15, name: 'r15_05_halftone_corner', path: '/iterations/r15_r15_05_halftone_corner.png' },
  { round: 15, name: 'r15_06_maze_circle', path: '/iterations/r15_r15_06_maze_circle.png' },
  { round: 15, name: 'r15_07_grid_band', path: '/iterations/r15_r15_07_grid_band.png' },
  { round: 15, name: 'r15_08_hex_zone', path: '/iterations/r15_r15_08_hex_zone.png' },
  
  // Round 16 - Sample inspired (BEST)
  { round: 16, name: 'r16_01_red_warm', path: '/iterations/r16_r16_01_red_warm.png' },
  { round: 16, name: 'r16_02_navy_blue', path: '/iterations/r16_r16_02_navy_blue.png' },
  { round: 16, name: 'r16_03_black_teal', path: '/iterations/r16_r16_03_black_teal.png' },
  { round: 16, name: 'r16_04_layered_waves', path: '/iterations/r16_r16_04_layered_waves.png' },
  { round: 16, name: 'r16_05_crosshatch', path: '/iterations/r16_r16_05_crosshatch.png' },
  { round: 16, name: 'r16_06_circle_grid', path: '/iterations/r16_r16_06_circle_grid.png' },
  { round: 16, name: 'r16_07_polkadot_layers', path: '/iterations/r16_r16_07_polkadot_layers.png' },
  { round: 16, name: 'r16_08_triangle_mesh', path: '/iterations/r16_r16_08_triangle_mesh.png' },
  
  // Round 17 - Wild exploration
  { round: 17, name: 'r17_01_wild_maze', path: '/iterations/r17_r17_01_wild_maze.png' },
  { round: 17, name: 'r17_02_electric_burst', path: '/iterations/r17_r17_02_electric_burst.png' },
  { round: 17, name: 'r17_03_flame_zones', path: '/iterations/r17_r17_03_flame_zones.png' },
  { round: 17, name: 'r17_04_chaos_stripes', path: '/iterations/r17_r17_04_chaos_stripes.png' },
  { round: 17, name: 'r17_05_void_circle', path: '/iterations/r17_r17_05_void_circle.png' },
  { round: 17, name: 'r17_06_neon_grid', path: '/iterations/r17_r17_06_neon_grid.png' },
  { round: 17, name: 'r17_07_wave_tsunami', path: '/iterations/r17_r17_07_wave_tsunami.png' },
  { round: 17, name: 'r17_08_splatter', path: '/iterations/r17_r17_08_splatter.png' },
];

export default function IterationsPage() {
  const [selectedDesign, setSelectedDesign] = useState<{ path: string; name: string; round: number } | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  // Group designs by round
  const rounds = Array.from(new Set(ALL_ITERATIONS.map(d => d.round))).sort((a, b) => a - b);
  
  const filteredRounds = filter === 'all' ? rounds : rounds.filter(r => r === parseInt(filter));
  
  const handleImageLoad = (path: string) => {
    setLoadedImages(prev => new Set(prev).add(path));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Design Iterations</h1>
            <p className="text-gray-400 mt-2">
              {ALL_ITERATIONS.length} designs across {rounds.length} exploration rounds
            </p>
          </div>
          <div className="flex gap-4">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Rounds</option>
              {rounds.map(r => (
                <option key={r} value={r}>Round {r}</option>
              ))}
            </select>
            <a 
              href="/"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Round labels and design grids */}
        <div className="space-y-12">
          {filteredRounds.map(round => (
            <div key={round} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                  round === 11 || round === 16 ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  Round {round}
                </div>
                <div className="h-px flex-1 bg-gray-700" />
                <span className="text-sm text-gray-500">
                  {ALL_ITERATIONS.filter(d => d.round === round).length} designs
                </span>
                {(round === 11 || round === 16) && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">⭐ Best</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {ALL_ITERATIONS.filter(d => d.round === round).map((design) => (
                  <button
                    key={design.path}
                    onClick={() => setSelectedDesign(design)}
                    className={`
                      group relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden 
                      hover:ring-2 hover:ring-blue-500 transition-all
                      ${loadedImages.has(design.path) ? '' : 'animate-pulse'}
                    `}
                  >
                    {/* Placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                    {/* Actual image */}
                    <img 
                      src={design.path}
                      alt={design.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={() => handleImageLoad(design.path)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500 text-xs p-2">${design.name}</div>`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">View</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Design Detail Modal */}
        {selectedDesign && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDesign(null)}
          >
            <div 
              className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedDesign.name}</h3>
                  <p className="text-sm text-gray-400">Round {selectedDesign.round}</p>
                </div>
                <button 
                  onClick={() => setSelectedDesign(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto">
                <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
                  <img 
                    src={selectedDesign.path}
                    alt={selectedDesign.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-400">Design exploration from the pi pipeline</span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      // TODO: Implement use as reference
                      alert('Use as reference - coming soon!');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    Use as Reference
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Regenerate Similar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}