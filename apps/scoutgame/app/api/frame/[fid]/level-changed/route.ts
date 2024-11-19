import type { TierChange } from '@packages/scoutgame/waitlist/scoring/constants';
import { uuidFromNumber } from '@packages/utils/uuid';

import { ScoutGameLaunchedFrame } from 'components/waitlistFrame/ScoutGameLaunchedFrame';
import { getReferrerFidFromUrl } from 'lib/waitlist/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/waitlist/mixpanel/trackWaitlistMixpanelEvent';

export async function GET(req: Request) {
  const reqAsURL = new URL(req.url);

  const referrerFid = getReferrerFidFromUrl(req);
  const tierChange = reqAsURL.searchParams.get('tierChange') as Extract<TierChange, 'up' | 'down'>;

  const frame = ScoutGameLaunchedFrame({
    referrerFid
  });

  trackWaitlistMixpanelEvent('frame_impression', {
    referrerUserId: uuidFromNumber(referrerFid),
    frame: `waitlist_level_${tierChange}`
  });

  return new Response(frame, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
