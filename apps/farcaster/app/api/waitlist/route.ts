import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';
import { getFrameHtml } from 'frames.js';

import {
  waitlistGet1000Points,
  waitlistGetDetails,
  waitlistShareMyFrame,
  type WaitlistFramePage
} from 'lib/waitlist/actionButtons';
import { calculateUserPosition } from 'lib/waitlist/calculateUserPosition';
import { joinWaitlist } from 'lib/waitlist/joinWaitlist';

export async function POST(req: Request, res: Response) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);

  const query = new URL(req.url).searchParams;

  const currentPage = query.get('current_page') as WaitlistFramePage;
  const referrerFid = query.get('referrer_fid');

  const joinWaitlistResult = await joinWaitlist({
    fid: interactorFid,
    referredByFid: referrerFid,
    username: validatedMessage.action.interactor.username
  });

  if (currentPage === 'join_waitlist_home') {
    let html: string = '';

    if (joinWaitlistResult.isNew) {
      // Dev image
      const imgSrc = `${baseUrl}/images/waitlist/dev/waitlist-joined.jpg`;

      // Prod image
      // const imgSrc = `${baseUrl}/images/waitlist/waitlist-joined.gif`;

      html = getFrameHtml({
        image: imgSrc,
        version: 'vNext',
        buttons: [waitlistGetDetails, waitlistGet1000Points, waitlistShareMyFrame(interactorFid)],
        imageAspectRatio: '1:1'
        // ogImage: `${baseUrl}/images/waitlist/waitlist-joined.gif`
      });
    } else {
      const currentScore = calculateUserPosition({
        fid: interactorFid
      });

      // Dev image
      // This key is be constructed so that it overcomes farcaster's cache
      const imgSrc = `${baseUrl}/api/waitlist/current-position?fid=${interactorFid}?percentile=${
        currentScore.percentile
      }&${Math.random().toString().replace('.', '')}`;

      // Prod image - TODO Add a joined image
      // const imgSrc = `${baseUrl}/images/waitlist/waitlist-joined.gif`;

      html = getFrameHtml({
        image: imgSrc,
        ogImage: imgSrc,
        version: 'vNext',
        buttons: [waitlistGetDetails, waitlistShareMyFrame(interactorFid)],
        imageAspectRatio: '1:1'
      });
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }

  return new Response(`Success`, { status: 200 });
}
