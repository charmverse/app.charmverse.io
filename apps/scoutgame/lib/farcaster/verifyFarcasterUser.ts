import { createAppClient, verifySignInMessage, viemConnector } from '@farcaster/auth-client';
import { getChainById } from '@root/connectors/chains';
import { InvalidStateError } from '@root/lib/middleware/errors';
import { optimism } from 'viem/chains';

import { authConfig, type AuthSchema } from './config';

const appClient = createAppClient({
  ethereum: viemConnector({
    rpcUrl: getChainById(optimism.id)!.rpcUrls[0]
  })
});

export async function verifyFarcasterUser({ nonce, message, signature }: AuthSchema): Promise<{ fid: number }> {
  const {
    success,
    fid,
    error: farcasterSignatureError
  } = await verifySignInMessage(appClient, {
    nonce,
    message,
    signature,
    domain: authConfig.domain
  });

  if (farcasterSignatureError) {
    throw new InvalidStateError(farcasterSignatureError.message || 'Invalid signature');
  } else if (!success) {
    throw new InvalidStateError('Invalid signature');
  }

  return { fid };
}
