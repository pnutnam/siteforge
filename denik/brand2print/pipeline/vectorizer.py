"""
Clean Layered Vectorizer v7 - Smooth Bezier curves, simplified paths
FREE alternative to VectoSolve with CORRECT dimensions
"""

from PIL import Image
import numpy as np
from potrace import Bitmap, POTRACE_TURNPOLICY_MINORITY
import cv2
from typing import Tuple, Dict, List
from pathlib import Path


def vectorize(
    input_path: str,
    output_path: str,
    smoothness: float = 1.334,
    simplify: float = 2.0,
    min_path_size: int = 50
) -> Dict:
    """
    Convert raster image to smooth layered SVG.
    
    Args:
        input_path: Source PNG/JPG
        output_path: Output SVG
        smoothness: 0-1.334, higher = smoother curves
        simplify: 0-5, higher = fewer paths/points
        min_path_size: Minimum path pixels to include
        
    Returns:
        Dict with stats
    """
    # Load source
    img = Image.open(input_path).convert('RGB')
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    # Detect colors
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    
    # Find dominant non-white color (foreground)
    is_white = (r > 252) & (g > 252) & (b > 252)
    
    # Alternative: find reddish/bright colors
    is_bright = (r > 140) & (r > g * 1.5) & (r > b * 1.5)
    
    if is_bright.sum() > is_white.sum():
        # Image is white with colored foreground
        trace_mask = is_bright
        bg_color = '#FFFFFF'
        fg_color_arr = arr[is_bright]
    else:
        # Image has colored background with white foreground
        trace_mask = is_white
        fg_color_arr = arr[is_white]
        is_colored = ~is_white
        bg_color_arr = arr[is_colored]
        bg_color = '#{:02X}{:02X}{:02X}'.format(
            *tuple(int(x) for x in bg_color_arr.mean(axis=0))
        )
    
    if len(fg_color_arr) > 0:
        fg_color = '#{:02X}{:02X}{:02X}'.format(
            *tuple(int(x) for x in fg_color_arr.mean(axis=0))
        )
    else:
        fg_color = '#000000'
    
    # Trace with potrace for smooth Bezier curves
    # Potrace traces BLACK (0) pixels
    bitmap_data = np.where(trace_mask, 0, 255).astype(np.uint8)
    
    try:
        bm = Bitmap(bitmap_data)
        plist = bm.trace(
            turdsize=min_path_size,
            turnpolicy=POTRACE_TURNPOLICY_MINORITY,
            alphamax=smoothness,  # Max smooth: 1.334
            opticurve=True,       
            opttolerance=simplify  # Higher = fewer points
        )
    except Exception as e:
        return {'error': str(e)}
    
    # Build SVG
    svg_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" ',
        f'     width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
        '',
    ]
    
    # Determine layer order
    if bg_color == '#FFFFFF':
        svg_parts.append(f'  <!-- BACKGROUND -->')
        svg_parts.append(f'  <rect width="{w}" height="{h}" fill="{bg_color}"/>')
        svg_parts.append('')
        fill_color = fg_color
    else:
        svg_parts.append(f'  <!-- BACKGROUND -->')
        svg_parts.append(f'  <rect width="{w}" height="{h}" fill="{bg_color}"/>')
        svg_parts.append('')
        fill_color = fg_color
    
    # Add paths
    svg_parts.append(f'  <!-- FOREGROUND ({len(plist)} smooth paths) -->')
    
    total_points = 0
    for curve in plist:
        segments = curve.segments
        start = curve.start_point
        
        path_d = f'M {start.x:.1f},{start.y:.1f} '
        
        for segment in segments:
            if segment.is_corner:
                # Corner - use line
                path_d += f'L {segment.c.x:.1f},{segment.c.y:.1f} '
                path_d += f'L {segment.end_point.x:.1f},{segment.end_point.y:.1f} '
                total_points += 2
            else:
                # Smooth Bezier curve
                path_d += f'C {segment.c1.x:.1f},{segment.c1.y:.1f} '
                path_d += f'{segment.c2.x:.1f},{segment.c2.y:.1f} '
                path_d += f'{segment.end_point.x:.1f},{segment.end_point.y:.1f} '
                total_points += 1
        
        path_d += 'Z'
        svg_parts.append(f'  <path d="{path_d}" fill="{fill_color}"/>')
    
    svg_parts.extend(['', '</svg>'])
    
    # Save
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        f.write('\n'.join(svg_parts))
    
    return {
        'dimensions': (w, h),
        'paths': len(plist),
        'control_points': total_points,
        'colors': [bg_color, fill_color] if bg_color != '#FFFFFF' else [fill_color],
        'file_size': output_path.stat().st_size,
        'output_path': str(output_path)
    }


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 3:
        print("Vectorizer - smooth Bezier SVG from raster")
        print("Usage: python vectorizer.py input.png output.svg")
        print("\nOptions via environment:")
        print("  SMOOTH=1.334  # max smoothness (default)")
        print("  SIMPLIFY=2.0  # path simplification (default)")
        sys.exit(1)
    
    import os
    smooth = float(os.environ.get('SMOOTH', 1.334))
    simplify = float(os.environ.get('SIMPLIFY', 2.0))
    
    stats = vectorize(
        sys.argv[1], 
        sys.argv[2],
        smoothness=smooth,
        simplify=simplify
    )
    
    print(f"\n✓ Vectorized: {sys.argv[1]}")
    print(f"  Output: {stats['output_path']}")
    print(f"  Dimensions: {stats['dimensions'][0]}x{stats['dimensions'][1]}")
    print(f"  Paths: {stats['paths']}, Points: {stats['control_points']}")
    print(f"  Colors: {', '.join(stats['colors'])}")
    print(f"  File size: {stats['file_size']/1024:.1f} KB")
