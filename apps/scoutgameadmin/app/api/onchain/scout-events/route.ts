import { getOnchainPurchaseEvents } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type RequestParams = {
  chainId: string;
  txHash: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scoutId = searchParams.get('scoutId');
  if (!scoutId) {
    return NextResponse.json({ message: 'Missing scoutId' }, { status: 400 });
  }
  const userPurchases = await getOnchainPurchaseEvents({ scoutId });
  return NextResponse.json(userPurchases);
}
