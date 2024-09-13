/* eslint-disable no-case-declarations */
import { InvalidInputError } from '@charmverse/core/errors';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { getCurrentFrameFromUrl, getReferrerFidFromUrl } from 'lib/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackMixpanelEvent';
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
    action: 'goto_app_home',
    frame: getCurrentFrameFromUrl(req)
  });

  await joinWaitlist({
    fid: interactorFid,
    referredByFid: referrerFid,
    username: interactorUsername
  });

  return new Response(null, { status: 302, headers: { Location: baseUrl as string } });
}
