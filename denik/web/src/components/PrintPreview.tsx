'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Printer, ZoomIn, ZoomOut, RotateCw, Grid3x3, Info, Check, X, FileText, ExternalLink } from 'lucide-react';

interface PrintSpec {
  width: number;      // in points (72pt = 1 inch)
  height: number;     // in points
  bleed: number;      // in points
  safeMargin: number; // in points
  bindingWidth: number;
}

const DEFAULT_SPECS: PrintSpec = {
  width: 378,    // 5.25" x 72pt
  height: 594,  // 8.25" x 72pt
  bleed: 3,     // 3pt bleed
  safeMargin: 12,
  bindingWidth: 15,
};

interface PrintPreviewProps {
  frontCover: string;  // SVG or image URL
  backCover?: string;  // Optional separate back cover
  spineDesign?: string; // Optional spine SVG
  specs?: Partial<PrintSpec>;
  brandName?: string;
  onDownload?: () => void;
  onPrint?: () => void;
}

type ViewMode = 'front' | 'back' | 'spine' | 'assembled';
type OverlayMode = 'none' | 'bleed' | 'safe' | 'grid';

export function PrintPreview({
  frontCover,
  backCover,
  spineDesign,
  specs = {},
  brandName = 'Notebook',
  onDownload,
  onPrint,
}: PrintPreviewProps) {
  const mergedSpecs = { ...DEFAULT_SPECS, ...specs };
  
  const [viewMode, setViewMode] = useState<ViewMode>('front');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [zoom, setZoom] = useState(0.5);
  const [showInfo, setShowInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert points to pixels based on zoom
  const scale = zoom;
  const pxPerPt = 1; // 1pt = 1px at 100% zoom (for simplicity)

  // Dimensions with bleed
  const totalWidth = mergedSpecs.width + mergedSpecs.bleed * 2 + mergedSpecs.bindingWidth;
  const totalHeight = mergedSpecs.height + mergedSpecs.bleed * 2;
  const scaledWidth = totalWidth * scale;
  const scaledHeight = totalHeight * scale;

  // Bleed dimensions
  const bleedPx = mergedSpecs.bleed * scale;
  const bindingPx = mergedSpecs.bindingWidth * scale;
  const safePx = mergedSpecs.safeMargin * scale;

  const handleDownload = async () => {
    setIsDownloading(true);
    if (onDownload) {
      await onDownload();
    }
    setTimeout(() => setIsDownloading(false), 1000);
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold">Print Preview</h3>
          <div className="flex bg-gray-700 rounded-lg p-0.5">
            {(['front', 'back', 'spine', 'assembled'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
              className="p-1.5 text-gray-400 hover:text-white rounded"
              disabled={zoom <= 0.25}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-1.5 text-gray-400 hover:text-white rounded"
              disabled={zoom >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Overlay Toggle */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setOverlayMode(overlayMode === 'none' ? 'bleed' : 'none')}
              className={`p-1.5 rounded ${overlayMode === 'bleed' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Show bleed area"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1.5 rounded ${showInfo ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Show info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Preparing...' : 'Download PDF'}
          </button>

          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div 
        ref={containerRef}
        className="flex items-center justify-center p-8 bg-gray-900 overflow-auto"
        style={{ minHeight: '600px' }}
      >
        <div 
          className="relative bg-white shadow-2xl"
          style={{ 
            width: scaledWidth, 
            height: scaledHeight,
            transition: 'width 0.2s, height 0.2s'
          }}
        >
          {/* Bleed Area Indicator */}
          {overlayMode === 'bleed' && (
            <div 
              className="absolute border-2 border-dashed border-orange-400 pointer-events-none"
              style={{
                top: bleedPx,
                left: bleedPx + bindingPx,
                right: bleedPx,
                bottom: bleedPx,
              }}
            />
          )}

          {/* Safe Area Indicator */}
          {(overlayMode === 'bleed' || overlayMode === 'safe') && (
            <div 
              className="absolute border border-green-400 pointer-events-none opacity-50"
              style={{
                top: bleedPx + safePx,
                left: bleedPx + bindingPx + safePx,
                right: bleedPx + safePx,
                bottom: bleedPx + safePx,
              }}
            />
          )}

          {/* Grid Overlay */}
          {overlayMode === 'grid' && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(128,128,128,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(128,128,128,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${10 * scale}px ${10 * scale}px`,
              }}
            />
          )}

          {/* Front Cover */}
          {(viewMode === 'front' || viewMode === 'assembled') && (
            <div 
              className="absolute overflow-hidden"
              style={{
                top: bleedPx,
                left: bleedPx + bindingPx,
                width: mergedSpecs.width * scale,
                height: mergedSpecs.height * scale,
              }}
            >
              <img
                src={frontCover}
                alt="Front Cover"
                className="w-full h-full object-cover"
              />
              {overlayMode === 'bleed' && (
                <div className="absolute inset-0 ring-2 ring-blue-500 ring-inset" />
              )}
            </div>
          )}

          {/* Spine (shown in assembled view) */}
          {viewMode === 'assembled' && (
            <div 
              className="absolute overflow-hidden bg-gray-200"
              style={{
                top: bleedPx,
                left: bleedPx,
                width: bindingPx,
                height: mergedSpecs.height * scale,
              }}
            >
              {spineDesign ? (
                <img src={spineDesign} alt="Spine" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span 
                    className="text-gray-500 font-bold"
                    style={{ 
                      fontSize: `${8 * scale}px`,
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      transform: 'rotate(180deg)'
                    }}
                  >
                    {brandName.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Back Cover (shown in assembled view) */}
          {viewMode === 'assembled' && (
            <div 
              className="absolute overflow-hidden bg-gray-100"
              style={{
                top: bleedPx,
                right: bleedPx,
                width: mergedSpecs.width * scale,
                height: mergedSpecs.height * scale,
              }}
            >
              {backCover ? (
                <img src={backCover} alt="Back Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FileText className="w-12 h-12" />
                </div>
              )}
            </div>
          )}

          {/* Binding Edge Indicator */}
          <div 
            className="absolute top-0 bottom-0 bg-gray-800"
            style={{
              left: bleedPx,
              width: bindingPx,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-white text-xs font-bold"
                style={{ 
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)'
                }}
              >
                BINDING
              </span>
            </div>
          </div>

          {/* Bleed Crop Marks */}
          {overlayMode === 'bleed' && (
            <>
              {/* Top-left */}
              <div className="absolute w-4 h-px bg-black" style={{ top: bleedPx - 4, left: bleedPx + bindingPx - 4 }} />
              <div className="absolute w-px h-4 bg-black" style={{ top: bleedPx - 4, left: bleedPx + bindingPx - 4 }} />
              
              {/* Top-right */}
              <div className="absolute w-4 h-px bg-black" style={{ top: bleedPx - 4, right: bleedPx - 4 }} />
              <div className="absolute w-px h-4 bg-black" style={{ top: bleedPx - 4, right: bleedPx - 4 }} />
              
              {/* Bottom-left */}
              <div className="absolute w-4 h-px bg-black" style={{ bottom: bleedPx - 4, left: bleedPx + bindingPx - 4 }} />
              <div className="absolute w-px h-4 bg-black" style={{ bottom: bleedPx - 4, left: bleedPx + bindingPx - 4 }} />
              
              {/* Bottom-right */}
              <div className="absolute w-4 h-px bg-black" style={{ bottom: bleedPx - 4, right: bleedPx - 4 }} />
              <div className="absolute w-px h-4 bg-black" style={{ bottom: bleedPx - 4, right: bleedPx - 4 }} />
            </>
          )}
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400 block">Size</span>
              <span className="text-white font-medium">
                {mergedSpecs.width / 72}" × {mergedSpecs.height / 72}"
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Bleed</span>
              <span className="text-white font-medium">
                {mergedSpecs.bleed / 72 * 100}%"
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Safe Margin</span>
              <span className="text-white font-medium">
                {mergedSpecs.safeMargin / 72 * 100}"
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Binding</span>
              <span className="text-white font-medium">
                {mergedSpecs.bindingWidth}pt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {overlayMode !== 'none' && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center gap-6 text-xs">
          {overlayMode === 'bleed' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-dashed border-orange-400" />
                <span className="text-gray-400">Bleed Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-green-400" />
                <span className="text-gray-400">Safe Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 ring-2 ring-blue-300" />
                <span className="text-gray-400">Design Area</span>
              </div>
            </>
          )}
          {overlayMode === 'safe' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-green-400" />
              <span className="text-gray-400">Safe Zone (keep text/logos here)</span>
            </div>
          )}
          {overlayMode === 'grid' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-700" />
              <span className="text-gray-400">10pt Grid</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone View Component for detailed inspection
interface PrintViewProps {
  cover: string;
  label: string;
  specs: PrintSpec;
  zoom: number;
  showOverlays: boolean;
}

export function PrintView({ cover, label, specs, zoom, showOverlays }: PrintViewProps) {
  const scale = zoom;
  const bleedPx = specs.bleed * scale;
  const bindingPx = specs.bindingWidth * scale;
  const safePx = specs.safeMargin * scale;

  const width = (specs.width + specs.bleed * 2 + specs.bindingWidth) * scale;
  const height = (specs.height + specs.bleed * 2) * scale;

  return (
    <div className="flex flex-col">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div 
        className="relative bg-white shadow-lg"
        style={{ width, height }}
      >
        {/* Overlays */}
        {showOverlays && (
          <>
            <div 
              className="absolute border-2 border-dashed border-orange-400"
              style={{
                top: bleedPx,
                left: bleedPx + bindingPx,
                right: bleedPx,
                bottom: bleedPx,
              }}
            />
            <div 
              className="absolute border border-green-400 pointer-events-none"
              style={{
                top: bleedPx + safePx,
                left: bleedPx + bindingPx + safePx,
                right: bleedPx + safePx,
                bottom: bleedPx + safePx,
              }}
            />
          </>
        )}

        {/* Cover Content */}
        <div 
          className="absolute overflow-hidden"
          style={{
            top: bleedPx,
            left: bleedPx + bindingPx,
            width: specs.width * scale,
            height: specs.height * scale,
          }}
        >
          <img src={cover} alt={label} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}

export default PrintPreview;
