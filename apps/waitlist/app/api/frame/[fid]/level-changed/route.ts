/* eslint-disable no-case-declarations */
import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { JoinWaitlistFrame } from 'components/frame/JoinWaitlistFrame';
import { LevelChangedFrame } from 'components/frame/LevelChangedFrame';
import { shareFrameUrl } from 'lib/frame/actionButtons';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackMixpanelEvent';
import type { TierChange } from 'lib/scoring/constants';
import { findOrCreateScoutGameUser } from 'lib/waitlistSlots/findOrCreateScoutGameUser';

export async function GET(req: Request) {
  const reqAsURL = new URL(req.url);

  const fid = parseInt(reqAsURL.pathname.split('/')[3]);
  const tierChange = reqAsURL.searchParams.get('tierChange') as Extract<TierChange, 'up' | 'down'>;
  const percentile = parseInt(reqAsURL.searchParams.get('percentile') as string);

  const frame = LevelChangedFrame({
    fid,
    percentile,
    tierChange
  });

  const scoutgameUser = await findOrCreateScoutGameUser({
    fid
  }).catch(() => {
    log.error(`Error finding or creating ScoutGameUser with fid ${fid}`);
  });

  trackWaitlistMixpanelEvent('frame_impression', {
    referrerUserId: scoutgameUser?.id || '',
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

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  const reqAsURL = new URL(req.url);

  const referrerFid = reqAsURL.pathname.split('/')[3];

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);
  const interactorUsername = validatedMessage.action.interactor.username;
  const tierChange = reqAsURL.searchParams.get('tierChange') as Extract<TierChange, 'up' | 'down'>;

  const button = validatedMessage.action.tapped_button.index;

  const scoutgameUser = await findOrCreateScoutGameUser({
    fid: interactorFid,
    username: interactorUsername
  }).catch(() => {
    log.error(`Error finding or creating ScoutGameUser with fid ${interactorFid}`);
  });

  const referrerScoutgameUser = await findOrCreateScoutGameUser({
    fid: parseInt(referrerFid)
  }).catch(() => {
    log.error(`Error finding or creating ScoutGameUser with fid ${referrerFid}`);
  });

  switch (button) {
    case 1:
      trackWaitlistMixpanelEvent('frame_click', {
        userId: scoutgameUser?.id || '',
        referrerUserId: referrerScoutgameUser?.id || '',
        action: 'click_whats_this',
        frame: `waitlist_level_${tierChange}`
      });
      return new Response(JoinWaitlistFrame({ referrerFid }), {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
      });
    case 2:
      trackWaitlistMixpanelEvent('frame_click', {
        userId: scoutgameUser?.id || '',
        referrerUserId: referrerScoutgameUser?.id || '',
        action: 'goto_app',
        frame: `waitlist_level_${tierChange}`
      });
      // Send to Waitlist home page
      return new Response(null, { status: 302, headers: { Location: baseUrl as string } });
    case 3:
      trackWaitlistMixpanelEvent('frame_click', {
        userId: scoutgameUser?.id || '',
        referrerUserId: referrerScoutgameUser?.id || '',
        action: 'click_share',
        frame: `waitlist_level_${tierChange}`
      });
      const warpcastShareUrl = shareFrameUrl(interactorFid);
      return new Response(null, { status: 302, headers: { Location: warpcastShareUrl } });
    default:
      return new Response('Invalid button index', { status: 500 });
  }
}
