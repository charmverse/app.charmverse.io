import { getTransactionStatusFromDecent } from '@packages/onchain/waitForDecentTransactionSettlement';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type RequestParams = {
  chainId: string;
  txHash: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const txHash = searchParams.get('txHash');
  if (!chainId || !txHash) {
    return NextResponse.json({ message: 'Missing chainId or txHash' }, { status: 400 });
  }
  const status = await getTransactionStatusFromDecent({
    sourceTxHash: txHash,
    sourceTxHashChainId: Number(chainId)
  });
  return NextResponse.json(status);
}
