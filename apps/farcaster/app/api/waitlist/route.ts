import { InvalidInputError } from '@charmverse/core/errors';
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
import { joinWaitlist } from 'lib/waitlist/joinWaitlist';

export async function POST(req: Request, res: Response) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);

  const currentPage = new URL(req.url).searchParams.get('current_page') as WaitlistFramePage;
  const referrerFid = new URL(req.url).searchParams.get('referrer_fid');

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
      // Dev image
      const imgSrc = `${baseUrl}/images/waitlist/dev/waitlist-current-score.jpg`;

      // Prod image - TODO Add a joined image
      // const imgSrc = `${baseUrl}/images/waitlist/waitlist-joined.gif`;

      html = getFrameHtml({
        image: imgSrc,
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
