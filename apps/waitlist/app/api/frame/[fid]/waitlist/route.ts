import { prisma } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { validateFrameInteractionViaAirstackWithErrorCatching } from '@root/lib/farcaster/airstack';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { JoinWaitlistFrame } from 'components/frame/JoinWaitlistFrame';
import { ScoutGameLaunchedFrame } from 'components/frame/ScoutGameLaunchedFrame';
import { WaitlistCurrentScoreFrame } from 'components/frame/WaitlistCurrentScoreFrame';
import { WaitlistJoinedFrame } from 'components/frame/WaitlistJoinedFrame';
import { getReferrerFidFromUrl } from 'lib/frame/getInfoFromUrl';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackWaitlistMixpanelEvent';
import { joinWaitlist } from 'lib/waitlistSlots/joinWaitlist';

export async function GET(req: Request) {
  const referrerFid = getReferrerFidFromUrl(req);

  const frame = ScoutGameLaunchedFrame({ referrerFid });

  trackWaitlistMixpanelEvent('frame_impression', {
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    frame: 'join_waitlist_info'
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

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    return new Response('Invalid frame interaction. Could not validate message', {
      status: 400
    });
  }

  validateFrameInteractionViaAirstackWithErrorCatching(waitlistClicked.trustedData.messageBytes);

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);

  const interactorUsername = validatedMessage.action.interactor.username;

  const referrerFid = getReferrerFidFromUrl(req);

  const joinWaitlistResult = await joinWaitlist({
    fid: interactorFid,
    referredByFid: referrerFid,
    username: interactorUsername,
    waitlistAnalytics: {
      source: 'frame',
      frame: 'join_waitlist_info',
      referrerUserId: deterministicV4UUIDFromFid(referrerFid),
      triggered_by_action: 'join_waitlist'
    }
  });

  trackWaitlistMixpanelEvent('frame_click', {
    userId: deterministicV4UUIDFromFid(interactorFid),
    referrerUserId: deterministicV4UUIDFromFid(referrerFid),
    frame: 'join_waitlist_info',
    action: 'join_waitlist'
  });

  // Disabled the level up level down for now.
  // const percentileChangeResults = await refreshPercentilesForEveryone();

  // handleTierChanges(percentileChangeResults);

  let html: string = '';

  if (joinWaitlistResult.isNew) {
    trackWaitlistMixpanelEvent('frame_impression', {
      userId: deterministicV4UUIDFromFid(interactorFid),
      referrerUserId: deterministicV4UUIDFromFid(referrerFid),
      frame: 'join_waitlist_new_join'
    });
    html = WaitlistJoinedFrame({ referrerFid });
  } else {
    const { percentile } = await prisma.connectWaitlistSlot.findFirstOrThrow({
      where: {
        fid: interactorFid
      },
      select: {
        percentile: true
      }
    });

    trackWaitlistMixpanelEvent('frame_impression', {
      userId: deterministicV4UUIDFromFid(interactorFid),
      referrerUserId: deterministicV4UUIDFromFid(referrerFid),
      frame: 'join_waitlist_current_score'
    });

    html = await WaitlistCurrentScoreFrame({
      percentile: percentile as number,
      referrerFid
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
