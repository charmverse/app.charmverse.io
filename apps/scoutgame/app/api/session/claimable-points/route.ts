import { NextResponse } from 'next/server';

import { getClaimablePoints } from 'lib/points/getClaimablePoints';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ points: 0 });
  }
  const result = await getClaimablePoints(user.id);
  return NextResponse.json({ points: result.totalClaimablePoints });
}
