import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { getUserProfile } from '@root/lib/profile/getUser';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { deleteBeehiivSubscription } from 'lib/beehiiv/deleteBeehiivSubscription';
import { registerBeehiivSubscription } from 'lib/beehiiv/registerBeehiivSubscription';
import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { deleteLoopsContact } from 'lib/loopsEmail/deleteLoopsContact';
import { registerLoopsContact } from 'lib/loopsEmail/registerLoopsContact';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { signupCookieNames } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { removeOldCookieFromResponse } from 'lib/session/removeOldCookie';
import { withSessionRoute } from 'lib/session/withSession';
import { createOrGetUserFromWallet } from 'lib/users/createUser';
import { updateUserProfile } from 'lib/users/updateUserProfile';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(requireWalletSignature, createUser).get(getUser).use(requireUser).put(updateUser);

async function createUser(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { message } = req.body as SignatureVerificationPayload;
  const cookiesToParse = req.cookies as Record<SignupCookieType, string>;
  const signupAnalytics = extractSignupAnalytics(cookiesToParse);

  const { user, isNew } = await createOrGetUserFromWallet(
    { address: message.address, id: req.session.anonymousUserId },
    signupAnalytics
  );

  if (isNew) {
    user.isNew = true;
  }
  // Null out the anonymous user id after successful login
  req.session.anonymousUserId = undefined;
  req.session.otpUser = undefined;
  req.session.user = { id: user.id };
  await req.session.save();

  await updateGuildRolesForUser(
    user.wallets.map((w) => w.address),
    user.spaceRoles
  );

  const cookies = new Cookies(req, res);

  signupCookieNames.forEach((cookie) => {
    cookies.set(cookie, null);
  });

  res.status(200).json(user);
}

export async function handleNoProfile(req: NextApiRequest, res: NextApiResponse) {
  if (!req.session.anonymousUserId) {
    req.session.anonymousUserId = v4();

    await req.session.save();
  }

  await removeOldCookieFromResponse(req, res, false);

  return res.status(404).json({ error: 'No user found' });
}

// Endpoint for a user to retrieve their own profile
async function getUser(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  if (!req.session?.user?.id) {
    return handleNoProfile(req, res);
  }

  const profile = await getUserProfile('id', req.session.user.id);

  // Clean up the anonymous id if the user has a profile
  if (req.session.anonymousUserId) {
    req.session.anonymousUserId = undefined;

    await req.session.save();
  }

  res.setHeader('Cache-Control', 'no-store');
  await removeOldCookieFromResponse(req, res, true);

  return res.status(200).json(profile);
}

async function updateUser(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const { id: userId } = req.session.user;

  const original = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    }
  });

  const updatedUser = await updateUserProfile(userId, req.body);

  updateTrackUserProfile(updatedUser);

  if (original.email !== updatedUser.email || original.emailNewsletter !== updatedUser.emailNewsletter) {
    try {
      if (!updatedUser.email) {
        // remove from Loops and Beehiiv
        await deleteLoopsContact({ email: original.email! });
        await deleteBeehiivSubscription({ email: original.email! });
      } else {
        await registerLoopsContact(updatedUser, original.email);
        await registerBeehiivSubscription(updatedUser, original.email);
      }
    } catch (error) {
      log.error('Error updating contact with Loop or Beehiiv', { error, userId });
    }
  }

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
