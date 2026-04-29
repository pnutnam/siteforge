/**
 * Unsplash API Integration
 * 
 * Provides brand inspiration search functionality.
 * API Docs: https://unsplash.com/documentation
 */

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
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
  width: number;
  height: number;
}

export interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

const UNSPLASH_API = 'https://api.unsplash.com';

export class UnsplashClient {
  private apiKey: string | null;
  private accessKey: string;

  constructor(accessKey?: string) {
    // Try environment variable first, then parameter
    this.accessKey = accessKey || process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
    this.apiKey = this.accessKey || null;
  }

  /**
   * Search photos by brand/company name
   */
  async searchPhotos(
    query: string,
    options: {
      page?: number;
      perPage?: number;
      orientation?: 'landscape' | 'portrait' | 'squarish';
      color?: string;
    } = {}
  ): Promise<UnsplashSearchResult> {
    const { page = 1, perPage = 20, orientation, color } = options;

    // Build query for brand inspiration
    const searchQuery = `${query} brand design inspiration ${orientation || ''}`.trim();

    const params = new URLSearchParams({
      query: searchQuery,
      page: page.toString(),
      per_page: perPage.toString(),
      ...(orientation && { orientation }),
      ...(color && { color }),
    });

    // If no API key, use demo mode
    if (!this.apiKey) {
      return this.getDemoResults(query);
    }

    try {
      const response = await fetch(
        `${UNSPLASH_API}/search/photos?${params}`,
        {
          headers: {
            Authorization: `Client-ID ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Unsplash search failed:', error);
      return this.getDemoResults(query);
    }
  }

  /**
   * Get brand-specific photos (logos, products, lifestyle)
   */
  async getBrandInspiration(
    brandName: string,
    options: {
      style?: 'minimal' | 'bold' | 'professional' | 'creative';
      limit?: number;
    } = {}
  ): Promise<UnsplashPhoto[]> {
    const { style = 'professional', limit = 15 } = options;

    // Build style-specific query
    const styleQueries: Record<string, string[]> = {
      minimal: [
        `${brandName} minimal design`,
        `${brandName} logo simple`,
        'minimalist brand',
      ],
      bold: [
        `${brandName} bold design`,
        `${brandName} vibrant`,
        'bold typography',
      ],
      professional: [
        `${brandName} professional`,
        `${brandName} corporate`,
        'business branding',
      ],
      creative: [
        `${brandName} creative`,
        `${brandName} artistic`,
        'creative design inspiration',
      ],
    };

    const queries = styleQueries[style] || styleQueries.professional;
    const allPhotos: UnsplashPhoto[] = [];

    // Search with multiple queries
    for (const query of queries.slice(0, 3)) {
      try {
        const results = await this.searchPhotos(query, { perPage: Math.ceil(limit / 3) });
        allPhotos.push(...results.results);
      } catch (error) {
        console.error(`Search failed for query "${query}":`, error);
      }
    }

    // Remove duplicates and limit
    const unique = allPhotos.reduce((acc, photo) => {
      if (!acc.find(p => p.id === photo.id)) {
        acc.push(photo);
      }
      return acc;
    }, [] as UnsplashPhoto[]);

    return unique.slice(0, limit);
  }

  /**
   * Get random photos for inspiration
   */
  async getRandomInspiration(
    query?: string,
    count: number = 10
  ): Promise<UnsplashPhoto[]> {
    if (!this.apiKey) {
      return this.getDemoResults(query || 'brand inspiration').results.slice(0, count);
    }

    try {
      const params = new URLSearchParams({
        count: count.toString(),
        ...(query && { query }),
      });

      const response = await fetch(
        `${UNSPLASH_API}/photos/random?${params}`,
        {
          headers: {
            Authorization: `Client-ID ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Unsplash random failed:', error);
      return this.getDemoResults(query || 'brand inspiration').results.slice(0, count);
    }
  }

  /**
   * Demo results when no API key is available
   */
  private getDemoResults(query: string): UnsplashSearchResult {
    // Generate demo results that look realistic
    const demoPhotos: UnsplashPhoto[] = [
      {
        id: 'demo_1',
        urls: {
          raw: `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800`,
          full: `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800`,
          regular: `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800`,
          small: `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400`,
          thumb: `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200`,
        },
        alt_description: `${query} - Professional brand design`,
        description: 'Modern business branding inspiration',
        user: { name: 'Unsplash Demo', username: 'demo', links: { html: '#' } },
        color: '#1a1a2e',
        width: 800,
        height: 600,
      },
      {
        id: 'demo_2',
        urls: {
          raw: `https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800`,
          full: `https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800`,
          regular: `https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800`,
          small: `https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400`,
          thumb: `https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=200`,
        },
        alt_description: `${query} - Creative design`,
        description: 'Bold and creative brand identity',
        user: { name: 'Unsplash Demo', username: 'demo', links: { html: '#' } },
        color: '#2d3436',
        width: 800,
        height: 1200,
      },
      {
        id: 'demo_3',
        urls: {
          raw: `https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800`,
          full: `https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800`,
          regular: `https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800`,
          small: `https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400`,
          thumb: `https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=200`,
        },
        alt_description: `${query} - Minimal design`,
        description: 'Clean minimalist branding',
        user: { name: 'Unsplash Demo', username: 'demo', links: { html: '#' } },
        color: '#f5f6fa',
        width: 800,
        height: 800,
      },
      {
        id: 'demo_4',
        urls: {
          raw: `https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800`,
          full: `https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800`,
          regular: `https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800`,
          small: `https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400`,
          thumb: `https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200`,
        },
        alt_description: `${query} - Professional branding`,
        description: 'Corporate identity inspiration',
        user: { name: 'Unsplash Demo', username: 'demo', links: { html: '#' } },
        color: '#dfe6e9',
        width: 800,
        height: 533,
      },
      {
        id: 'demo_5',
        urls: {
          raw: `https://images.unsplash.com/photo-1561070791-36c11767b26a?w=800`,
          full: `https://images.unsplash.com/photo-1561070791-36c11767b26a?w=800`,
          regular: `https://images.unsplash.com/photo-1561070791-36c11767b26a?w=800`,
          small: `https://images.unsplash.com/photo-1561070791-36c11767b26a?w=400`,
          thumb: `https://images.unsplash.com/photo-1561070791-36c11767b26a?w=200`,
        },
        alt_description: `${query} - Typography design`,
        description: 'Creative typography and branding',
        user: { name: 'Unsplash Demo', username: 'demo', links: { html: '#' } },
        color: '#2c3e50',
        width: 800,
        height: 1067,
      },
    ];

    return {
      total: demoPhotos.length,
      total_pages: 1,
      results: demoPhotos,
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let unsplashClient: UnsplashClient | null = null;

export function getUnsplashClient(): UnsplashClient {
  if (!unsplashClient) {
    unsplashClient = new UnsplashClient();
  }
  return unsplashClient;
}

// Demo mode helper - generates inspiration based on brand name
export function generateBrandInspiration(brandName: string): UnsplashPhoto[] {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  const styles = ['professional', 'creative', 'minimal', 'bold'];
  
  return Array.from({ length: 8 }, (_, i) => ({
    id: `brand_${i}`,
    urls: {
      raw: `https://picsum.photos/seed/${brandName.toLowerCase().replace(/\s+/g, '-')}-${i}/800/600`,
      full: `https://picsum.photos/seed/${brandName.toLowerCase().replace(/\s+/g, '-')}-${i}/800/600`,
      regular: `https://picsum.photos/seed/${brandName.toLowerCase().replace(/\s+/g, '-')}-${i}/800/600`,
      small: `https://picsum.photos/seed/${brandName.toLowerCase().replace(/\s+/g, '-')}-${i}/400/300`,
      thumb: `https://picsum.photos/seed/${brandName.toLowerCase().replace(/\s+/g, '-')}-${i}/200/150`,
    },
    alt_description: `${brandName} inspiration - ${styles[i % styles.length]} style`,
    description: `${brandName} brand design inspiration`,
    user: {
      name: 'Demo',
      username: 'demo',
      links: { html: '#' },
    },
    color: colors[i % colors.length],
    width: 800,
    height: 600,
  }));
}
