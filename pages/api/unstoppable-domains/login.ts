import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { UnstoppableDomainsAuthSig } from 'lib/blockchain/unstoppableDomains';
import {
  assignUnstoppableDomainAsUserIdentity,
  extractProofParams,
  verifyUnstoppableDomainsSignature
} from 'lib/blockchain/unstoppableDomains';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(loginViaUnstoppableDomains);

export type UnstoppableDomainsLoginRequest = {
  authSig: UnstoppableDomainsAuthSig;
};

async function loginViaUnstoppableDomains(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const { authSig } = req.body as UnstoppableDomainsLoginRequest;

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
    req.session.user = { id: user.id };
    await req.session.save();
    res.status(200).json(user);
  } else {
    const cookiesToParse = req.cookies as Record<SignupCookieType, string>;

    const signupAnalytics = extractSignupAnalytics(cookiesToParse);

    // See if we can resolve domain to an existing user
    const userWallet = await prisma.userWallet.findUnique({
      where: {
        address
      }
    });

    const user: LoggedInUser = !userWallet
      ? await createUserFromWallet(address, signupAnalytics)
      : await getUserProfile('id', userWallet.userId);

    await prisma.unstoppableDomain.create({
      data: {
        domain,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    if (!userWallet) {
      await assignUnstoppableDomainAsUserIdentity({ domain, userId: user.id });
    }
    req.session.user = { id: user.id };
    await req.session.save();
    res.status(200).json(user);
  }
}

export default withSessionRoute(handler);
