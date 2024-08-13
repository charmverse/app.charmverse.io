import { InvalidInputError } from '@charmverse/core/errors';
import type { FarcasterFrameInteractionToValidate } from '@root/lib/farcaster/validateFrameInteraction';
import { validateFrameInteraction } from '@root/lib/farcaster/validateFrameInteraction';
import { prettyPrint } from '@root/lib/utils/strings';

export async function POST(req: Request, res: Response) {
  const waitlistClicked = (await req.json()) as FarcasterFrameInteractionToValidate;

  const validatedMessage = await validateFrameInteraction(waitlistClicked.trustedData.messageBytes);

  if (!validatedMessage.valid) {
    throw new InvalidInputError('Invalid frame interaction. Could not validate message');
  }

  prettyPrint({ validatedMessage });

  return new Response(`Success`, { status: 200 });
}
