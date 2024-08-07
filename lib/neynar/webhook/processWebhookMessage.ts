import { createHmac } from 'crypto';

import type { WebhookMessageProcessResult } from '@root/lib/collabland/webhook/interfaces';

import { createFarcasterCastFromCastEvent } from '../createFarcasterCastFromCastEvent';
import { createFarcasterCastFromReactionEvent } from '../createFarcasterCastFromReactionEvent';
import type { Cast } from '../interfaces';
import { removeFarcasterCastFromReactionEvent } from '../removeFarcasterCastFromReactionEvent';

type UserDehydrated = {
  object: 'user_dehydrated';
  fid: number;
  username: string;
};

type CastDehydrated = {
  object: 'cast_dehydrated';
  hash: string;
  author: UserDehydrated;
};

type ReactionData = {
  object: 'reaction';
  event_timestamp: string;
  timestamp: string;
  reaction_type: number;
  user: UserDehydrated;
  cast: CastDehydrated;
};

export type ReactionEvent = {
  created_at: number;
  type: 'reaction.created' | 'reaction.deleted';
  data: ReactionData;
};

export type CastEvent = {
  created_at: number;
  type: 'cast.created';
  data: Cast;
};

type NeynarWebhookPayload = {
  body: ReactionEvent | CastEvent;
  headers: {
    [key: string]: any;
    'x-neynar-signature': string;
  };
};

type MessageHandlers = {
  'reaction.created': (message: ReactionEvent) => Promise<WebhookMessageProcessResult>;
  'reaction.deleted': (message: ReactionEvent) => Promise<WebhookMessageProcessResult>;
  'cast.created': (message: CastEvent) => Promise<WebhookMessageProcessResult>;
};

const messageHandlers: MessageHandlers = {
  'reaction.created': async (message) => {
    return createFarcasterCastFromReactionEvent(message);
  },

  'reaction.deleted': async (message) => {
    return removeFarcasterCastFromReactionEvent(message);
  },

  'cast.created': async (message) => {
    return createFarcasterCastFromCastEvent(message);
  }
};

export async function processWebhookMessage(message: NeynarWebhookPayload): Promise<WebhookMessageProcessResult> {
  const data = message?.body;
  const type = data?.type as keyof MessageHandlers;

  if (!messageHandlers[type]) {
    // we cannot process this message, just remove from queue
    return {
      success: true,
      message: `Unsupported action payload: ${type || 'undefined'}`
    };
  }

  const hasPermission = await verifyWebhookMessagePermission(message);
  if (!hasPermission) {
    return {
      success: true,
      message: 'Webhook message without permission to be parsed.'
    };
  }

  const handler = messageHandlers[type];
  return handler(data as any);
}

export async function verifyWebhookMessagePermission(message: NeynarWebhookPayload) {
  const neynarSignature = message.headers['x-neynar-signature'];
  if (!neynarSignature) {
    return false;
  }
  const generatedSignature = createHmac('sha512', process.env.NEYNAR_WEBHOOK_SECRET!)
    .update(JSON.stringify(message.body))
    .digest('hex');

  return neynarSignature === generatedSignature;
}
