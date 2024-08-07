import { FarcasterCastAction, prisma } from '@charmverse/core/prisma-client';

import type { WebhookMessageProcessResult } from '../collabland/webhook/interfaces';

import { getFarcasterCasts } from './getFarcasterCasts';
import type { ReactionEvent } from './webhook/processWebhookMessage';

export async function createFarcasterCastFromReactionEvent(
  message: ReactionEvent
): Promise<WebhookMessageProcessResult> {
  const [farcasterCast] = await getFarcasterCasts([message.data.cast.hash]);

  if (farcasterCast) {
    const type = message.type;
    const reactionType = message.data.reaction_type;
    let action: FarcasterCastAction | null = null;

    if (type === 'reaction.created') {
      if (reactionType === 1) {
        action = FarcasterCastAction.like_created;
      } else if (reactionType === 2) {
        action = FarcasterCastAction.recast_created;
      }
    } else if (type === 'reaction.deleted') {
      if (reactionType === 1) {
        action = FarcasterCastAction.like_removed;
      } else if (reactionType === 2) {
        action = FarcasterCastAction.recast_removed;
      }
    }

    if (!action) {
      return {
        success: false,
        message: `Farcaster cast action not found for reaction: ${message.data.reaction_type}`
      };
    }

    await prisma.farcasterCast.create({
      data: {
        action,
        authorFid: message.data.cast.author.fid,
        hash: message.data.cast.hash,
        text: farcasterCast.text,
        channel: farcasterCast.channel?.id,
        embeds: farcasterCast.embeds as any[],
        totalComments: farcasterCast.replies.count,
        totalLikes: farcasterCast.reactions.likes_count,
        totalRecasts: farcasterCast.reactions.recasts_count
      }
    });
  }

  return {
    success: true,
    message: `Farcaster cast created from reaction: ${message.data.reaction_type}`
  };
}
