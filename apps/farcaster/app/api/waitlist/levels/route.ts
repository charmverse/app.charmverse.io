import { InvalidInputError } from '@charmverse/core/errors';
import { baseUrl } from '@root/config/constants';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';

import { type WaitlistFramePage } from 'lib/waitlist/actionButtons';

export async function POST(req: Request, res: Response) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;
  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  // const interactorFid = parseInt(validatedMessage.action.interactor.fid.toString(), 10);
  // const currentPage = new URL(req.url).searchParams.get('current_page') as WaitlistFramePage;
  // const referrerFid = new URL(req.url).searchParams.get('referrer_fid');

  return Response.redirect(new URL(`${baseUrl}/waitlist`, req.url), 302);

  return new Response(`Success`, { status: 200 });
}
