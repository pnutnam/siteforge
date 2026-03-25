import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '../../../lib/get-payload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payload: string }> }
) {
  const { payload: collectionSlug } = await params;

  try {
    const payload = await getPayloadClient();
    const queryParams = Object.fromEntries(request.nextUrl.searchParams);

    const result = await payload.find({
      collection: collectionSlug,
      query: queryParams,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching ${collectionSlug}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payload: string }> }
) {
  const { payload: collectionSlug } = await params;

  try {
    const payload = await getPayloadClient();
    const body = await request.json();

    const result = await payload.create({
      collection: collectionSlug,
      data: body,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Error creating in ${collectionSlug}:`, error);
    return NextResponse.json(
      { error: 'Failed to create data' },
      { status: 500 }
    );
  }
}
