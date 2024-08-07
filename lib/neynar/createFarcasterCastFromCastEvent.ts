import { prisma } from '@charmverse/core/prisma-client';

import type { WebhookMessageProcessResult } from '../collabland/webhook/interfaces';

import type { CastEvent } from './webhook/processWebhookMessage';

export async function createFarcasterCastFromCastEvent(message: CastEvent): Promise<WebhookMessageProcessResult> {
  await prisma.farcasterCast.create({
    data: {
      action: 'cast_created',
      authorFid: message.data.author.fid,
      hash: message.data.hash,
      text: message.data.text,
      channel: message.data.channel?.id,
      embeds: message.data.embeds as any[],
      totalComments: message.data.replies.count,
      totalLikes: message.data.reactions.likes_count,
      totalRecasts: message.data.reactions.recasts_count,
      timestamp: new Date(message.created_at)
    }
  });

  return {
    success: true,
    message: `Farcaster cast created from cast: ${message.data.hash}`
  };
}
