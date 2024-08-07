import { prisma } from '@charmverse/core/prisma-client';

import type { WebhookMessageProcessResult } from '../collabland/webhook/interfaces';

import type { ReactionEvent } from './webhook/processWebhookMessage';

export async function removeFarcasterCastFromReactionEvent(
  message: ReactionEvent
): Promise<WebhookMessageProcessResult> {
  const castHash = message.data.cast.hash;
  try {
    await prisma.farcasterCast.delete({
      where: { hash: castHash }
    });
  } catch (_) {
    //
  }

  return {
    success: true,
    message: `Farcaster cast removed from reaction: ${castHash}`
  };
}
