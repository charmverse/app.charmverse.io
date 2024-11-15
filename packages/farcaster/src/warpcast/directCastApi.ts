import { PUT } from '@packages/utils/http';
import { v4 as uuid } from 'uuid';

// API Key requires special privileges to use this method
const warpcastApiKey = process.env.WARPCAST_API_KEY;

// Docs: https://warpcast.notion.site/Direct-Cast-API-Reference-Public-1276a6c0c1018089af2bda0d1697a2fd

// Sends a message to a group chat, conversation or recipient depending on which id is provided.
// limit: Max 5,000 messages per caller per day.
export function sendDirectCast(params: {
  conversationId?: string;
  groupId?: string;
  recipientFid?: number;
  inReplyToMessageId?: string;
  message: string;
}) {
  if (params.message.length > 1024) {
    throw new Error('Message length must be less than 1024 characters');
  }
  return PUT<{ result: { messageId: string; conversationId?: string } }>(
    'https://api.warpcast.com/fc/message',
    {
      ...params,
      recipientFid: params.recipientFid?.toString()
    },
    {
      headers: {
        Authorization: `Bearer ${warpcastApiKey}`,
        // allows idempotent retries
        'idempotency-key': uuid()
      }
    }
  );
}
