// docs.neynar.com/reference/publish-message

import { ExternalServiceError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Cast } from '@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster';
import { POST } from '@packages/utils/http';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from '../constants';

// TBD - https://github.com/neynarxyz/farcaster-examples/tree/main/managed-signers

// https://docs.neynar.com/reference/post-cast
// https://github.com/neynarxyz/farcaster-examples/tree/main/gm-bot

export async function writeToFarcaster({
  neynarSignerId,
  text,
  channelId,
  embedUrl
}: {
  neynarSignerId: string;
  text: string;
  channelId?: string;
  embedUrl?: string;
}): Promise<Cast> {
  const baseUrl = `${NEYNAR_API_BASE_URL}/cast`;

  const message = await POST<{ cast?: Cast; success: boolean }>(
    baseUrl,
    {
      text,
      channel_id: channelId,
      signer_uuid: neynarSignerId,
      embeds: embedUrl ? [{ url: embedUrl }] : undefined
    },
    {
      headers: {
        accept: 'application/json',
        api_key: NEYNAR_API_KEY
      }
    }
  );

  if (!message.success || !message.cast) {
    log.error('Failed to write to Farcaster', { error: message });
    throw new ExternalServiceError('Failed to write to Farcaster');
  }

  return message.cast;
}
