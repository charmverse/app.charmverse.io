import { ExternalServiceError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { POST } from '@packages/utils/http';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from '../constants';

// Copied from @neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster - Fails in CI so ported the type here
type Cast = {
  hash: string;
  parent_hash: string | null;
  parent_url: string | null;
  root_parent_url: string | null;
  parent_author: any;
  author: any;
  text: string;
  timestamp: string;
  embeds: any[];
  type?: any;
};

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
