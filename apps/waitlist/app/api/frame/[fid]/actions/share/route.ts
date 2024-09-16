/* eslint-disable no-case-declarations */
import { InvalidInputError } from '@charmverse/core/errors';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { shareFrameUrl } from 'lib/frame/actionButtons';
import { getCurrentFrameFromUrl, getReferrerFidFromUrl } from 'lib/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackWaitlistMixpanelEvent';
import { joinWaitlist } from 'lib/waitlistSlots/joinWaitlist';

export async function POST(req: Request) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  const referrerFid = getReferrerFidFromUrl(req);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);
  const interactorUsername = validatedMessage.action.interactor.username;

  trackWaitlistMixpanelEvent('frame_click', {
    userId: deterministicV4UUIDFromFid(interactorFid),
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    action: 'click_share',
    frame: getCurrentFrameFromUrl(req)
  });

  await joinWaitlist({
    fid: interactorFid,
    username: interactorUsername,
    referredByFid: referrerFid,
    waitlistAnalytics: {
      source: 'frame',
      frame: getCurrentFrameFromUrl(req),
      referrerUserId: deterministicV4UUIDFromFid(referrerFid),
      triggered_by_action: 'click_share'
    }
  });

  const warpcastShareUrl = shareFrameUrl(interactorFid);
  return new Response(null, { status: 302, headers: { Location: warpcastShareUrl } });
}
