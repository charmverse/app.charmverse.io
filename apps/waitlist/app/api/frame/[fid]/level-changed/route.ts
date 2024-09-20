/* eslint-disable no-case-declarations */
import { InvalidInputError } from '@charmverse/core/errors';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { validateFrameInteractionViaAirstackWithErrorCatching } from '@root/lib/farcaster/airstack';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { JoinWaitlistFrame } from 'components/frame/JoinWaitlistFrame';
import { LevelChangedFrame } from 'components/frame/LevelChangedFrame';
import { getReferrerFidFromUrl } from 'lib/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackWaitlistMixpanelEvent';
import type { TierChange } from 'lib/scoring/constants';

export async function GET(req: Request) {
  const reqAsURL = new URL(req.url);

  const referrerFid = getReferrerFidFromUrl(req);
  const tierChange = reqAsURL.searchParams.get('tierChange') as Extract<TierChange, 'up' | 'down'>;
  const percentile = parseInt(reqAsURL.searchParams.get('percentile') as string);

  const frame = LevelChangedFrame({
    referrerFid,
    percentile,
    tierChange
  });

  trackWaitlistMixpanelEvent('frame_impression', {
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    frame: `waitlist_level_${tierChange}`
  });

  return new Response(frame, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

export async function POST(req: Request) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const reqAsURL = new URL(req.url);

  const referrerFid = getReferrerFidFromUrl(req);

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    return new Response('Invalid frame interaction. Could not validate message', {
      status: 400
    });
  }

  validateFrameInteractionViaAirstackWithErrorCatching(waitlistClicked.trustedData.messageBytes);

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);
  const tierChange = reqAsURL.searchParams.get('tierChange') as Extract<TierChange, 'up' | 'down'>;

  trackWaitlistMixpanelEvent('frame_click', {
    userId: deterministicV4UUIDFromFid(interactorFid),
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    action: 'click_whats_this',
    frame: `waitlist_level_${tierChange}`
  });

  trackWaitlistMixpanelEvent('frame_impression', {
    userId: deterministicV4UUIDFromFid(interactorFid),
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    frame: `join_waitlist_info`
  });
  return new Response(JoinWaitlistFrame({ referrerFid }), {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
