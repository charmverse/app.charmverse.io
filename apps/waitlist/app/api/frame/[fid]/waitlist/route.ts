import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { JoinWaitlistFrame } from 'components/frame/JoinWaitlistFrame';
import { WaitlistCurrentScoreFrame } from 'components/frame/WaitlistCurrentScoreFrame';
import { WaitlistJoinedFrame } from 'components/frame/WaitlistJoinedFrame';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackMixpanelEvent';
import { handleTierChanges, refreshPercentilesForEveryone } from 'lib/scoring/refreshPercentilesForEveryone';
import { findOrCreateScoutGameUser } from 'lib/waitlistSlots/findOrCreateScoutGameUser';
import { joinWaitlist } from 'lib/waitlistSlots/joinWaitlist';

export async function GET(req: Request) {
  const fid = new URL(req.url).pathname.split('/')[3];

  const frame = JoinWaitlistFrame({ referrerFid: fid });

  const scoutgameUser = await findOrCreateScoutGameUser({
    fid: parseInt(fid)
  }).catch(() => {
    log.error(`Error finding or creating ScoutGameUser with fid ${fid}`);
  });

  trackWaitlistMixpanelEvent('frame_impression', {
    referrerUserId: scoutgameUser?.id || '',
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
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);

  const interactorUsername = validatedMessage.action.interactor.username;

  const referrerFid = new URL(req.url).pathname.split('/')[3];

  const joinWaitlistResult = await joinWaitlist({
    fid: interactorFid,
    referredByFid: referrerFid,
    username: validatedMessage.action.interactor.username
  });

  const percentileChangeResults = await refreshPercentilesForEveryone();

  handleTierChanges(percentileChangeResults);

  let html: string = '';

  const scoutGameUser = await findOrCreateScoutGameUser({
    fid: interactorFid
  }).catch(() => {
    log.error(`Error finding or creating ScoutGameUser with fid ${interactorFid}`);
  });

  const referrerScoutGameUser = await findOrCreateScoutGameUser({
    fid: parseInt(referrerFid)
  }).catch(() => {
    log.error(`Error finding or creating ScoutGameUser with fid ${interactorFid}`);
  });

  if (joinWaitlistResult.isNew) {
    trackWaitlistMixpanelEvent('frame_impression', {
      userId: scoutGameUser?.id,
      referrerUserId: referrerScoutGameUser?.id || '',
      frame: 'join_waitlist_new_join'
    });
    html = await WaitlistJoinedFrame({ fid: interactorFid, username: interactorUsername });
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
      userId: scoutGameUser?.id,
      referrerUserId: referrerScoutGameUser?.id || '',
      frame: 'join_waitlist_current_score'
    });

    html = await WaitlistCurrentScoreFrame({
      fid: interactorFid,
      percentile: percentile as number,
      username: interactorUsername
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
