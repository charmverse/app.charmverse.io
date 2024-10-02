import { getWaitlistSlotWithClicks } from '@packages/scoutgame/waitlist/scoring/getWaitlistSlotWithClicks';

import { ScorePage } from 'components/score/ScorePage';
import { getSession } from 'lib/session/getSession';

// Dynamic data
export const dynamic = 'force-dynamic';

export default async function Score() {
  const session = await getSession();

  // Redirect is handled in the middleware
  if (!session.farcasterUser) {
    return null;
  }

  const waitlistSlot = await getWaitlistSlotWithClicks({ fid: parseInt(session.farcasterUser.fid) }).catch(() => null);

  // Redirect is handled in the middleware
  if (!waitlistSlot) {
    return null;
  }

  return <ScorePage waitlistSlot={waitlistSlot} fid={session.farcasterUser.fid} />;
}
