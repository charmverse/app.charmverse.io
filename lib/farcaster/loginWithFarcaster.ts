import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { createAppClient, verifySignInMessage, viemConnector } from '@farcaster/auth-client';
import { getChainById } from '@root/connectors/chains';
import type { SignupAnalytics } from '@root/lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { InvalidStateError } from '@root/lib/middleware';
import { getUserProfile } from '@root/lib/users/getUser';
import { postUserCreate } from '@root/lib/users/postUserCreate';
import { InvalidInputError } from '@root/lib/utils/errors';
import type { LoggedInUser } from '@root/models';
import { optimism } from 'viem/chains';

import { trackOpSpaceClickSigninEvent } from '../metrics/mixpanel/trackOpSpaceSigninEvent';

import { createOrUpdateFarcasterUser } from './createOrUpdateFarcasterUser';

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

export type LoginWithFarcasterParams = FarcasterBody &
  Required<Pick<FarcasterBody, 'nonce' | 'message' | 'signature'>> & {
    signupAnalytics?: Partial<SignupAnalytics>;
    nonce: string;
    message: string;
    newUserId?: string;
    signature: string;
  };

export async function loginWithFarcaster({
  fid,
  pfpUrl,
  username,
  displayName,
  bio,
  verifications = [],
  signupAnalytics = {},
  nonce,
  message,
  newUserId,
  signature
}: LoginWithFarcasterParams): Promise<LoggedInUser> {
  if (!fid || !username) {
    log.warn('Farcaster id or username missing on login', { fid, displayName, username });
    throw new InvalidInputError('Farcaster id missing');
  }

  const { success, error: farcasterLoginError } = await verifySignInMessage(appClient, {
    nonce,
    message,
    signature,
    domain: 'charmverse.io'
  });

  if (farcasterLoginError) {
    throw new InvalidStateError(farcasterLoginError.message || 'Invalid signature');
  } else if (!success) {
    throw new InvalidStateError('Invalid signature');
  }

  const { created, userId } = await createOrUpdateFarcasterUser({
    fid,
    username,
    displayName,
    bio,
    pfpUrl,
    verifications,
    newUserId
  });

  if (!created) {
    trackUserAction('sign_in', { userId, identityType: 'Farcaster' });

    await trackOpSpaceClickSigninEvent({
      userId,
      identityType: 'Farcaster'
    });

    return getUserProfile('id', userId);
  } else {
    const newUser = await getUserProfile('id', userId);
    postUserCreate({ user: newUser, identityType: 'Farcaster', signupAnalytics });
    return newUser;
  }
}
