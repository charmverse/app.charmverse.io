import { InvalidInputError } from '@charmverse/core/errors';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';
import { prettyPrint } from '@root/lib/utils/strings';
import { getFrameHtml } from 'frames.js';

import { waitlistGet1000Points, waitlistGetDetails, type WaitlistFramePage } from 'lib/waitlist/actionButtons';
import { joinWaitlist } from 'lib/waitlist/joinWaitlist';

export async function POST(req: Request, res: Response) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const currentPage = new URL(req.url).searchParams.get('current_page') as WaitlistFramePage;
  const referrerFid = new URL(req.url).searchParams.get('referrer_fid');

  const joinWaitlistResult = await joinWaitlist({
    fid: parseInt(validatedMessage.action.interactor.fid.toString(), 10),
    referredByFid: referrerFid,
    username: validatedMessage.action.interactor.username
  });

  if (currentPage === 'join_waitlist_home') {
    let html: string = '';

    if (joinWaitlistResult.isNew) {
      html = getFrameHtml({
        image: `${baseUrl}/images/waitlist/waitlist-joined.gif`,
        version: 'vNext',
        buttons: [waitlistGetDetails, waitlistGet1000Points],
        imageAspectRatio: '1:1'
        // ogImage: `${baseUrl}/images/waitlist/waitlist-joined.gif`
      });
    } else {
      html = getFrameHtml({
        image: `${baseUrl}/images/waitlist/waitlist-joined.gif`,
        version: 'vNext',
        buttons: [waitlistGetDetails],
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

  prettyPrint({ validatedMessage });

  return new Response(`Success`, { status: 200 });
}
