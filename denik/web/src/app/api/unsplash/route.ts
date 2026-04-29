import { NextRequest, NextResponse } from 'next/server';
import { getUnsplashClient, generateBrandInspiration } from '@/lib/unsplash';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const brand = url.searchParams.get('brand') || '';
  const style = url.searchParams.get('style') || 'professional';
  const limit = parseInt(url.searchParams.get('limit') || '30');
  const page = parseInt(url.searchParams.get('page') || '1');

  if (!query && !brand) {
    return NextResponse.json(
      { error: 'Query or brand name required' },
      { status: 400 }
    );
  }

  const searchTerm = query || brand;

  try {
    const client = getUnsplashClient();

    let photos;
    if (client.isConfigured()) {
      // Direct search for specific query, respect limit and page
      const results = await client.searchPhotos(searchTerm, {
        page,
        perPage: Math.min(limit, 50),
      });
      photos = results.results;
    } else {
      // Demo mode: generate mock inspiration
      photos = generateBrandInspiration(searchTerm);
    }

    return NextResponse.json({
      success: true,
      query: searchTerm,
      count: photos.length,
      page,
      photos,
      mode: client.isConfigured() ? 'live' : 'demo',
    });
  } catch (error) {
    console.error('Unsplash API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration', details: String(error) },
      { status: 500 }
    );
  }
}
