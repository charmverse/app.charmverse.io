import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ points: 0 });
  }
  const claimablePoints = await getClaimablePoints({ userId: user.id });
  return NextResponse.json({ points: claimablePoints.points });
}
