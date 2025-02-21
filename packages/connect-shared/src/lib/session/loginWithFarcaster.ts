import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { createAppClient, verifySignInMessage, viemConnector } from '@farcaster/auth-client';
import { getChainById } from '@packages/connectors/chains';
import { createOrUpdateFarcasterUser } from '@packages/farcaster/createOrUpdateFarcasterUser';
import type { SignupAnalytics } from '@packages/metrics/mixpanel/interfaces/UserEvent';
import { trackOpSpaceClickSigninEvent } from '@packages/metrics/mixpanel/trackOpSpaceSigninEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { InvalidStateError } from '@packages/nextjs/errors';
import { getUserProfile } from '@packages/profile/getUser';
import type { LoggedInUser } from '@packages/profile/getUser';
import { postUserCreate } from '@packages/users/postUserCreate';
import { InvalidInputError } from '@packages/utils/errors';
import { optimism } from 'viem/chains';

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
