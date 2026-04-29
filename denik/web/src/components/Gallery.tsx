'use client';

import { useState, useRef, useCallback } from 'react';
import { Check, X, ZoomIn, Download, ChevronLeft, ChevronRight, Wand2, RotateCcw, Eye, Grid, LayoutGrid } from 'lucide-react';

interface InspirationItem {
  id: string;
  path: string;
  prompt: string;
  style: string;
  selected?: boolean;
}

interface GalleryProps {
  items: InspirationItem[];
  selectedId: string | null;
  onSelect: (item: InspirationItem) => void;
  onRegenerate: () => void;
  onRefine?: (notes: string) => void;
  isLoading?: boolean;
  isRefining?: boolean;
}

type ViewMode = 'grid' | 'masonry' | 'compare';

export function Gallery({
  items,
  selectedId,
  onSelect,
  onRegenerate,
  onRefine,
  isLoading = false,
  isRefining = false,
}: GalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refinementNotes, setRefinementNotes] = useState('');
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Derive values for consistent comparison
  const isCompareView = viewMode === 'compare';
  const isGridView = viewMode === 'grid';
  const isMasonryView = viewMode === 'masonry';

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((i) => i !== id));
    } else if (compareIds.length < 3) {
      setCompareIds([...compareIds, id]);
    }
  };

  const handleRefineSubmit = () => {
    if (onRefine && refinementNotes.trim()) {
      onRefine(refinementNotes);
      setShowRefineModal(false);
      setRefinementNotes('');
    }
  };

  const expandedItem = expandedId ? items.find((i) => i.id === expandedId) : null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">
            {selectedId ? 'Review Selection' : 'Select Inspiration'}
          </h3>
          <span className="text-sm text-gray-400">
            {items.length} designs
            {selectedId && ' • Click to change selection'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${isGridView ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-1.5 rounded ${isMasonryView ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Masonry view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`p-1.5 rounded ${isCompareView ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Compare mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Compare Selection */}
          {isCompareView && compareIds.length > 0 && (
            <span className="text-sm text-gray-400">
              {compareIds.length} selected for comparison
            </span>
          )}

          {/* Actions */}
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          {onRefine && selectedId && (
            <button
              onClick={() => setShowRefineModal(true)}
              disabled={isRefining}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isRefining ? 'animate-spin' : ''}`} />
              Refine
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <span className="ml-4 text-gray-400">Generating designs...</span>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && isGridView && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              isCompareMode={isCompareView}
              isComparing={compareIds.includes(item.id)}
              onSelect={() => onSelect(item)}
              onExpand={() => setExpandedId(item.id)}
              onCompare={() => handleCompare(item.id)}
            />
          ))}
        </div>
      )}

      {/* Carousel View */}
      {!isLoading && isMasonryView && (
        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-72 scroll-snap-align-start"
              >
                <GalleryCard
                  item={item}
                  isSelected={item.id === selectedId}
                  isCompareMode={isCompareView}
                  isComparing={compareIds.includes(item.id)}
                  onSelect={() => onSelect(item)}
                  onExpand={() => setExpandedId(item.id)}
                  onCompare={() => handleCompare(item.id)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Compare View */}
      {!isLoading && isCompareView && (
        <CompareView
          items={items.filter((i) => compareIds.includes(i.id) || (compareIds.length === 0 && items.indexOf(i) < 3))}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      )}

      {/* Expanded Preview Modal */}
      {expandedItem && (
        <ExpandedPreview
          item={expandedItem}
          onClose={() => setExpandedId(null)}
          onSelect={() => {
            onSelect(expandedItem);
            setExpandedId(null);
          }}
          onPrev={() => {
            const idx = items.findIndex((i) => i.id === expandedId);
            if (idx > 0) setExpandedId(items[idx - 1].id);
          }}
          onNext={() => {
            const idx = items.findIndex((i) => i.id === expandedId);
            if (idx < items.length - 1) setExpandedId(items[idx + 1].id);
          }}
          hasPrev={items.findIndex((i) => i.id === expandedId) > 0}
          hasNext={items.findIndex((i) => i.id === expandedId) < items.length - 1}
        />
      )}

      {/* Refine Modal */}
      {showRefineModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Refine Design</h3>
              <button
                onClick={() => setShowRefineModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Describe how you&apos;d like to refine the selected design.
            </p>

            <textarea
              value={refinementNotes}
              onChange={(e) => setRefinementNotes(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 resize-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Make it more minimalist, adjust the color balance, add more white space..."
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRefineModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefineSubmit}
                disabled={!refinementNotes.trim() || isRefining}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {isRefining ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Refine Design
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-Components
// ============================================

interface GalleryCardProps {
  item: InspirationItem;
  isSelected: boolean;
  isCompareMode: boolean;
  isComparing: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onCompare: () => void;
}

function GalleryCard({
  item,
  isSelected,
  isCompareMode,
  isComparing,
  onSelect,
  onExpand,
  onCompare,
}: GalleryCardProps) {
  return (
    <div
      className={`
        relative group cursor-pointer rounded-xl overflow-hidden transition-all
        ${isSelected ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-gray-900' : ''}
        ${isComparing ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-gray-500'}
      `}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="aspect-[3/4] bg-gray-800">
        <img
          src={item.path}
          alt={item.prompt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-xs text-gray-300 truncate">{item.style}</p>
        </div>
      </div>

      {/* Selected Check */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Compare Checkbox */}
      {isCompareMode && (
        <div
          className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isComparing
              ? 'bg-blue-500 border-blue-500'
              : 'border-white/50 bg-black/30 hover:border-white'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onCompare();
          }}
        >
          {isComparing && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* Expand Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ExpandedPreviewProps {
  item: InspirationItem;
  onClose: () => void;
  onSelect: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function ExpandedPreview({
  item,
  onClose,
  onSelect,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ExpandedPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-3xl max-h-[85vh]">
        <img
          src={item.path}
          alt={item.prompt}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{item.style}</p>
          <p className="text-gray-400 text-sm">{item.prompt}</p>
        </div>
        <button
          onClick={onSelect}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Check className="w-5 h-5" />
          Select This Design
        </button>
      </div>
    </div>
  );
}

interface CompareViewProps {
  items: InspirationItem[];
  onSelect: (item: InspirationItem) => void;
  selectedId: string | null;
}

function CompareView({ items, onSelect, selectedId }: CompareViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Select up to 3 designs to compare
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            relative rounded-xl overflow-hidden cursor-pointer transition-all
            ${item.id === selectedId ? 'ring-4 ring-green-500' : 'hover:ring-2 hover:ring-gray-500'}
          `}
          onClick={() => onSelect(item)}
        >
          <img
            src={item.path}
            alt={item.prompt}
            className="w-full aspect-[3/4] object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-medium">{item.style}</p>
            <p className="text-gray-300 text-sm truncate">{item.prompt}</p>
          </div>
          {item.id === selectedId && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Gallery;
