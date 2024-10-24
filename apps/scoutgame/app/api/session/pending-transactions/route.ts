import { getSession } from '@connect-shared/lib/session/getSession';
import { NextResponse } from 'next/server';

import { getPendingNftTransactions } from 'lib/session/getPendingNftTransactions';

// Get all pending transactions for the current user
export async function GET() {
  const { scoutId } = await getSession();
  const transactions = await getPendingNftTransactions(scoutId);
  return NextResponse.json(transactions);
}
