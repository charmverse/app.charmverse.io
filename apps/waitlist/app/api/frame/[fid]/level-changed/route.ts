import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';
import { getFrameHtml } from 'frames.js';

import {
  waitlistGet10Clicks,
  waitlistGetDetails,
  waitlistShareMyFrame,
  type WaitlistFramePage
} from 'lib/frame/actionButtons';
import { handleTierChanges, refreshPercentilesForEveryone } from 'lib/scoring/refreshPercentilesForEveryone';
import { joinWaitlist } from 'lib/waitlistSlots/joinWaitlist';

export async function POST(req: Request, res: Response) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);

  const interactorUsername = validatedMessage.action.interactor.username;

  const query = new URL(req.url).searchParams;

  const referrerFid = new URL(req.url).pathname.split('/').pop();

  const currentPage = query.get('current_page') as WaitlistFramePage;

  const joinWaitlistResult = await joinWaitlist({
    fid: interactorFid,
    referredByFid: referrerFid,
    username: validatedMessage.action.interactor.username
  });

  const percentileChangeResults = await refreshPercentilesForEveryone();

  handleTierChanges(percentileChangeResults);

  if (currentPage === 'join_waitlist_home') {
    let html: string = '';

    if (joinWaitlistResult.isNew) {
      const imgSrc = `${baseUrl}/images/waitlist/waitlist-joined.gif`;

      html = getFrameHtml({
        image: imgSrc,
        ogImage: imgSrc,
        version: 'vNext',
        buttons: [
          await waitlistGetDetails({ fid: interactorFid, username: interactorUsername }),
          await waitlistGet10Clicks({ fid: interactorFid, username: interactorUsername }),
          waitlistShareMyFrame(interactorFid)
        ],
        imageAspectRatio: '1:1'
      });
    } else {
      const { percentile } = await prisma.connectWaitlistSlot.findFirstOrThrow({
        where: {
          fid: interactorFid
        },
        select: {
          percentile: true
        }
      });

      // This key is being constructed so that it overcomes farcaster's cache
      const imgSrc = `${baseUrl}/api/frame/${referrerFid}/current-position?percentile=${percentile}`;

      html = getFrameHtml({
        image: imgSrc,
        ogImage: imgSrc,
        version: 'vNext',
        buttons: [
          await waitlistGetDetails({ fid: interactorFid, username: interactorUsername }),
          waitlistShareMyFrame(interactorFid)
        ],
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
