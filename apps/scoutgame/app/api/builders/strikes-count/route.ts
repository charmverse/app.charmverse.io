import { getBuilderStrikesCount } from '@packages/scoutgame/builders/getBuilderStrikesCount';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const builderId = request.nextUrl.searchParams.get('builderId');
  if (!builderId) {
    return new Response('Builder ID is required', { status: 400 });
  }

  const strikesCount = await getBuilderStrikesCount(builderId);
  return Response.json(strikesCount);
}
