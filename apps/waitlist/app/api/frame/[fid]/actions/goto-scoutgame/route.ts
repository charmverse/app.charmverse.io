/* eslint-disable no-case-declarations */
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { baseUrl } from '@root/config/constants';
import { validateFrameInteractionViaAirstackWithErrorCatching } from '@root/lib/farcaster/airstack';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { getCurrentFrameFromUrl, getReferrerFidFromUrl } from 'lib/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackWaitlistMixpanelEvent';

export async function POST(req: Request) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const referrerFid = getReferrerFidFromUrl(req);

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    return new Response('Invalid frame interaction. Could not validate message', {
      status: 400
    });
  }

  validateFrameInteractionViaAirstackWithErrorCatching(waitlistClicked.trustedData.messageBytes);

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);

  trackWaitlistMixpanelEvent('frame_click', {
    userId: deterministicV4UUIDFromFid(interactorFid),
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    action: 'goto_scoutgame',
    frame: getCurrentFrameFromUrl(req)
  });

  return new Response(null, { status: 302, headers: { Location: `https://scoutgame.xyz` } });
}
