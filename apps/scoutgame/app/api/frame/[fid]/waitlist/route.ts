import { uuidFromNumber } from '@packages/utils/uuid';

import { ScoutGameLaunchedFrame } from 'components/waitlistFrame/ScoutGameLaunchedFrame';
import { getReferrerFidFromUrl } from 'lib/waitlist/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/waitlist/mixpanel/trackWaitlistMixpanelEvent';

export async function GET(req: Request) {
  const referrerFid = getReferrerFidFromUrl(req);

  const frame = ScoutGameLaunchedFrame({ referrerFid });

  trackWaitlistMixpanelEvent('frame_impression', {
    referrerUserId: uuidFromNumber(referrerFid),
    frame: 'join_waitlist_info'
  });

  return new Response(frame, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
