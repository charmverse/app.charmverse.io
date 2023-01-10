import { prisma } from 'db';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import { updateUsedIdentity } from 'lib/users/updateUsedIdentity';
import { DisabledAccountError, UnauthorisedActionError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { extractProofParams } from './client';
import type { UnstoppableDomainsAuthSig } from './interfaces';
import { verifyUnstoppableDomainsSignature } from './verifyUnstoppableDomainsSignature';

export type UnstoppableDomainsLoginRequest = {
  authSig: UnstoppableDomainsAuthSig;
  signupAnalytics?: Partial<SignupAnalytics>;
};

export async function loginWithUnstoppableDomain({
  authSig,
  signupAnalytics = {}
}: UnstoppableDomainsLoginRequest): Promise<LoggedInUser> {
  const isValid = verifyUnstoppableDomainsSignature(authSig);

  if (!isValid) {
    throw new UnauthorisedActionError(`Wallet signature is invalid`);
  }

  const address = authSig.idToken.wallet_address.toLowerCase();

  const proofParams = extractProofParams(authSig);

  const domain = proofParams.uri.split('uns:')[1];

  const existingDomain = await prisma.unstoppableDomain.findUnique({
    where: {
      domain
    }
  });

  // Domain already registered to a user. Set this as active identity
  if (existingDomain) {
    const user = await getUserProfile('id', existingDomain.userId);
    if (user.deletedAt) {
      throw new DisabledAccountError();
    }
    trackUserAction('sign_in', { userId: user.id, identityType: 'UnstoppableDomain' });
    return user;
  } else {
    // See if we can resolve domain to an existing user
    const userWallet = await prisma.userWallet.findUnique({
      where: {
        address
      }
    });

    const user: LoggedInUser = !userWallet
      ? await createUserFromWallet({ address }, signupAnalytics)
      : await getUserProfile('id', userWallet.userId);

    if (user.deletedAt) {
      throw new DisabledAccountError();
    }

    const createdDomain = await prisma.unstoppableDomain.create({
      data: {
        domain,
        user: {
          connect: {
            id: user.id
          }
        }
      },
      select: {
        domain: true
      }
    });

    // If the wallet didn't exist, there was no such user
    if (!userWallet) {
      const updatedUser = await updateUsedIdentity(user.id, {
        displayName: domain,
        identityType: 'UnstoppableDomain'
      });
      updateTrackUserProfile(updatedUser);
      trackUserAction('sign_up', { userId: updatedUser.id, identityType: 'Wallet', ...signupAnalytics });
    }

    updateTrackUserProfile(user);
    trackUserAction('sign_in', { userId: user.id, identityType: 'UnstoppableDomain' });
    return {
      ...user,
      unstoppableDomains: [createdDomain]
    };
  }
}
