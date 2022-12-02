import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { UnstoppableDomainsAuthSig } from 'lib/blockchain/verifyUnstoppableDomainsSignature';
import {
  assignUnstoppableDomainAsUserIdentity,
  extractProofParams,
  verifyUnstoppableDomainsSignature
} from 'lib/blockchain/verifyUnstoppableDomainsSignature';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
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
    const user = await assignUnstoppableDomainAsUserIdentity({
      domain: existingDomain.domain,
      userId: existingDomain.userId
    });
    req.session.user = user as LoggedInUser;
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

    const loggedInUser = await prisma.$transaction(
      async (tx) => {
        let userId: string;

        if (!userWallet) {
          const user = await createUserFromWallet(address, signupAnalytics, req.session.anonymousUserId, tx);
          userId = user.id;
        } else {
          userId = userWallet.userId;
        }

        await tx.unstoppableDomain.create({
          data: {
            domain,
            user: {
              connect: {
                id: userId
              }
            }
          }
        });

        const updatedUser = await assignUnstoppableDomainAsUserIdentity({ domain, userId, tx });

        return updatedUser;
      },
      { timeout: 10000 }
    );
    req.session.user = loggedInUser as LoggedInUser;
    await req.session.save();
    res.status(200).json(loggedInUser);
  }
}

export default withSessionRoute(handler);
