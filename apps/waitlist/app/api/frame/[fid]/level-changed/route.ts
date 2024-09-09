/* eslint-disable no-case-declarations */
import { InvalidInputError } from '@charmverse/core/errors';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { JoinWaitlistFrame } from 'components/frame/JoinWaitlistFrame';
import { LevelChangedFrame } from 'components/frame/LevelChangedFrame';
import { shareFrameUrl } from 'lib/frame/actionButtons';
import type { TierChange } from 'lib/scoring/constants';

export async function GET(req: Request) {
  const reqAsURL = new URL(req.url);

  const fid = reqAsURL.pathname.split('/')[3];
  const tierChange = reqAsURL.searchParams.get('tierChange') as TierChange;
  const percentile = parseInt(reqAsURL.searchParams.get('percentile') as string);

  const frame = LevelChangedFrame({
    fid,
    percentile,
    tierChange
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

  const referrerFid = new URL(req.url).pathname.split('/')[3];

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);
  const interactorUsername = validatedMessage.action.interactor.username;

  const button = validatedMessage.action.tapped_button.index;

  switch (button) {
    case 1:
      return new Response(JoinWaitlistFrame({ referrerFid }), {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
      });
    case 2:
      // Send to Waitlist home page
      return new Response(null, { status: 302, headers: { Location: baseUrl as string } });
    case 3:
      const warpcastShareUrl = shareFrameUrl(interactorFid);
      return new Response(null, { status: 302, headers: { Location: warpcastShareUrl } });
    default:
      return new Response('Invalid button index', { status: 500 });
  }
}
