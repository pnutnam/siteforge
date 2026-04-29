'use client';

import { useState, useCallback } from 'react';
import { Search, Image, ExternalLink, Loader2, Plus, Check, X, Sparkles, RefreshCw } from 'lucide-react';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  color: string | null;
}

interface InspirationSearchProps {
  brandName: string;
  selectedPhotos: UnsplashPhoto[];
  onSelect: (photo: UnsplashPhoto) => void;
  onDeselect: (photoId: string) => void;
  onSearchComplete?: () => void;
}

export function InspirationSearch({
  brandName,
  selectedPhotos,
  onSelect,
  onDeselect,
}: InspirationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(brandName || '');
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<'professional' | 'creative' | 'minimal' | 'bold'>('professional');

  const searchInspiration = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/unsplash?q=${encodeURIComponent(searchQuery)}&style=${style}&limit=15`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch inspiration');
      }

      const data = await response.json();
      setPhotos(data.photos || []);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, style]);

  const isSelected = (photo: UnsplashPhoto) => {
    return selectedPhotos.some(p => p.id === photo.id);
  };

  const handleSelect = (photo: UnsplashPhoto) => {
    if (isSelected(photo)) {
      onDeselect(photo.id);
    } else {
      onSelect(photo);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchInspiration()}
            placeholder="Search for inspiration..."
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Style Selector */}
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as typeof style)}
          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="professional">Professional</option>
          <option value="creative">Creative</option>
          <option value="minimal">Minimal</option>
          <option value="bold">Bold</option>
        </select>

        <button
          onClick={searchInspiration}
          disabled={isLoading || !searchQuery.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Search
        </button>
      </div>

      {/* Style Pills */}
      <div className="flex gap-2 flex-wrap">
        {(['professional', 'creative', 'minimal', 'bold'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStyle(s); if (searchQuery.trim()) searchInspiration(); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              style === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-400">Searching Unsplash...</span>
        </div>
      ) : hasSearched && photos.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No results found for "{searchQuery}"</p>
          <p className="text-gray-500 text-sm mt-2">Try a different search term or style</p>
        </div>
      ) : photos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {photos.length} inspiration images for "{searchQuery}"
            </p>
            <button
              onClick={searchInspiration}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {photos.map((photo) => {
              const selected = isSelected(photo);
              return (
                <div
                  key={photo.id}
                  onClick={() => handleSelect(photo)}
                  className={`
                    relative group cursor-pointer rounded-xl overflow-hidden
                    transition-all transform hover:scale-[1.02]
                    ${selected ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-gray-900' : 'hover:ring-2 hover:ring-gray-500'}
                  `}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gray-800">
                    <img
                      src={photo.urls.small}
                      alt={photo.alt_description || 'Inspiration'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay */}
                  <div className={`
                    absolute inset-0 transition-opacity
                    ${selected ? 'bg-green-600/40' : 'bg-black/0 group-hover:bg-black/40'}
                  `}>
                    {/* Selection Badge */}
                    {selected && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Hover Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">
                        {photo.alt_description || photo.description || 'Inspiration'}
                      </p>
                      <p className="text-[10px] text-gray-300">
                        by {photo.user.name}
                      </p>
                    </div>
                  </div>

                  {/* Color indicator */}
                  {photo.color && (
                    <div
                      className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-white/50"
                      style={{ backgroundColor: photo.color }}
                      title={photo.color || undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Attribution */}
          <div className="text-center">
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-400 inline-flex items-center gap-1"
            >
              Photos provided by Unsplash
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Search for inspiration images</p>
          <p className="text-sm mt-1">Enter a brand name or design style above</p>
        </div>
      )}

      {/* Selected Photos Summary */}
      {selectedPhotos.length > 0 && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">
              {selectedPhotos.length} image{selectedPhotos.length !== 1 ? 's' : ''} selected for inspiration
            </p>
          </div>
          
          {/* Selected Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {selectedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden group"
              >
                <img
                  src={photo.urls.thumb}
                  alt={photo.alt_description || 'Selected'}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onDeselect(photo.id)}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InspirationSearch;
