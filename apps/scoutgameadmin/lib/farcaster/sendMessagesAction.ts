'use server';

import { log } from '@charmverse/core/log';
import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';
import { sendDirectCast } from '@packages/farcaster/warpcast/directCastApi';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

export type SuccessResponse = {
  type: 'success';
  sent: number;
};

export type InvalidInputResponse = {
  type: 'invalid_input';
  invalidRecipients: string[];
};

export type APIErrorResponse = {
  type: 'warpcast_error';
  sentRecipients: string[];
  unsentRecipients: string[];
  error: string;
};

export const sendMessagesAction = authActionClient
  .metadata({ actionName: 'delete_repo' })
  .schema(
    yup.object({
      recipients: yup.array().of(yup.string().required()).required(),
      message: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { recipients, message } = parsedInput;

    const invalidRecipients: string[] = [];
    const recipientFids: [string, number][] = [];

    for (const recipient of recipients) {
      try {
        const recipientFid = await getFarcasterFid(recipient);
        if (!recipientFid) {
          log.warn(`Could not find Farcaster ID for ${recipient}`);
          invalidRecipients.push(recipient);
        } else {
          recipientFids.push([recipient, recipientFid]);
        }
      } catch (error) {
        log.error(`Error getting Farcaster ID for ${recipient}`, { error });
        invalidRecipients.push(recipient);
      }
    }
    if (invalidRecipients.length > 0) {
      return { type: 'invalid_input', invalidRecipients };
    }
    const sentRecipients: string[] = [];
    const unsentRecipients: string[] = [];
    let sendingError: string | undefined;
    for (const [recipient, recipientFid] of recipientFids) {
      try {
        const result = await sendDirectCast({ recipientFid, message });
        log.info(`Sent message to ${recipientFid}`, { recipientFid, result });
        sentRecipients.push(recipient);
      } catch (error) {
        log.error(`Error sending message to ${recipientFid}`, {
          recipient,
          recipientFid,
          error,
          errors: (error as any).errors
        });
        unsentRecipients.push(recipient);
        sendingError = (error as Error).message || (error as any).errors?.[0]?.message || error;
      }
    }
    if (unsentRecipients.length > 0) {
      return {
        type: 'warpcast_error',
        sentRecipients,
        unsentRecipients,
        error: sendingError
      };
    }
    return { sent: sentRecipients.length, type: 'success' };
  });

async function getFarcasterFid(recipient: string) {
  // if recipient is a number, return it
  if (!Number.isNaN(Number(recipient))) {
    return Number(recipient);
  }
  const user = await getFarcasterUserByUsername(recipient);
  return user?.fid;
}
