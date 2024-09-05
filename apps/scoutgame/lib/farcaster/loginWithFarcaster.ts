import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { createAppClient, verifySignInMessage, viemConnector } from '@farcaster/auth-client';
import { getChainById } from '@root/connectors/chains';
import type { SignupAnalytics } from '@root/lib/metrics/mixpanel/interfaces/UserEvent';
import { InvalidStateError } from '@root/lib/middleware';
import { InvalidInputError } from '@root/lib/utils/errors';
import { optimism } from 'viem/chains';

import { findOrCreateUser } from 'lib/user/findOrCreateUser';

const appClient = createAppClient({
  ethereum: viemConnector({
    rpcUrl: getChainById(optimism.id)!.rpcUrls[0]
  })
});

export type FarcasterProfileInfo = {
  fid: number | undefined;
  username?: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
};

export type LoginWithFarcasterParams = FarcasterBody & {
  signupAnalytics?: Partial<SignupAnalytics>;
  newUserId?: string;
};

export async function loginWithFarcaster({
  fid,
  pfpUrl,
  username,
  displayName,
  bio,
  verifications = [],
  nonce,
  message,
  newUserId,
  signature
}: LoginWithFarcasterParams): Promise<Scout> {
  if (!fid || !username) {
    log.warn('Farcaster id or username missing on login', { fid, displayName, username });
    throw new InvalidInputError('Farcaster id missing');
  }

  if (!nonce || !message || !signature) {
    log.warn('Nonce, message or signature is missing', { fid, displayName, username });
    throw new InvalidInputError('Missing required fields for message verification');
  }

  const { success, error: farcasterSignatureError } = await verifySignInMessage(appClient, {
    nonce,
    message,
    signature,
    domain: 'charmverse.io'
  });

  if (farcasterSignatureError) {
    throw new InvalidStateError(farcasterSignatureError.message || 'Invalid signature');
  } else if (!success) {
    throw new InvalidStateError('Invalid signature');
  }

  return findOrCreateUser({
    farcasterId: fid.toString(),
    newUserId,
    walletAddress: verifications.sort()[0]
  });
}
