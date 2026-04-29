'use client';

import { useState } from 'react';
import { BrandGuidelines } from '@/types/pipeline';
import { Play, Loader2 } from 'lucide-react';

interface BrandFormProps {
  onSubmit: (brand: BrandGuidelines, direction: string) => Promise<void>;
  isLoading: boolean;
}

export function BrandForm({ onSubmit, isLoading }: BrandFormProps) {
  const [brand, setBrand] = useState<BrandGuidelines>({
    client_name: '',
    primary_colors: [''],
    secondary_colors: [''],
    approved_fonts: [''],
    visual_vibe: '',
    style_preference: 'minimalist',
    constraints: null,
  });
  const [artisticDirection, setArtisticDirection] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(brand, artisticDirection);
  };

  const addColor = (type: 'primary' | 'secondary') => {
    if (type === 'primary') {
      setBrand({ ...brand, primary_colors: [...brand.primary_colors, ''] });
    } else {
      setBrand({ ...brand, secondary_colors: [...brand.secondary_colors, ''] });
    }
  };

  const updateColor = (type: 'primary' | 'secondary', index: number, value: string) => {
    if (type === 'primary') {
      const colors = [...brand.primary_colors];
      colors[index] = value;
      setBrand({ ...brand, primary_colors: colors });
    } else {
      const colors = [...brand.secondary_colors];
      colors[index] = value;
      setBrand({ ...brand, secondary_colors: colors });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">New Pipeline Run</h2>
      
      {/* Client Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
        <input
          type="text"
          value={brand.client_name}
          onChange={(e) => setBrand({ ...brand, client_name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Salesforce"
          required
        />
      </div>

      {/* Primary Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Primary Colors</label>
        <div className="space-y-2">
          {brand.primary_colors.map((color, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="color"
                value={color || '#000000'}
                onChange={(e) => updateColor('primary', i, e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => updateColor('primary', i, e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="#00A1E0"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => addColor('primary')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add color
          </button>
        </div>
      </div>

      {/* Secondary Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Secondary Colors</label>
        <div className="space-y-2">
          {brand.secondary_colors.map((color, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="color"
                value={color || '#000000'}
                onChange={(e) => updateColor('secondary', i, e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => updateColor('secondary', i, e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="#032D60"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => addColor('secondary')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add color
          </button>
        </div>
      </div>

      {/* Visual Vibe */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Visual Vibe</label>
        <input
          type="text"
          value={brand.visual_vibe}
          onChange={(e) => setBrand({ ...brand, visual_vibe: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          placeholder="e.g., Modern, clean, professional"
        />
      </div>

      {/* Style Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Style Preference</label>
        <select
          value={brand.style_preference}
          onChange={(e) => setBrand({ ...brand, style_preference: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="minimalist">Minimalist</option>
          <option value="bold">Bold</option>
          <option value="geometric">Geometric</option>
          <option value="abstract">Abstract</option>
          <option value="floral">Floral</option>
          <option value="illustrative">Illustrative</option>
        </select>
      </div>

      {/* Artistic Direction */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Artistic Direction</label>
        <textarea
          value={artisticDirection}
          onChange={(e) => setArtisticDirection(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 resize-none"
          placeholder="Describe the creative direction for this notebook cover..."
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Starting Pipeline...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Start Pipeline
          </>
        )}
      </button>
    </form>
  );
}
