import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { SignatureVerificationPayload } from '@packages/lib/blockchain/signAndVerify';
import { updateGuildRolesForUser } from '@packages/lib/guild-xyz/server/updateGuildRolesForUser';
import { deleteLoopsContact } from '@packages/lib/loopsEmail/deleteLoopsContact';
import { registerLoopsContact } from '@packages/lib/loopsEmail/registerLoopsContact';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { requireWalletSignature } from '@packages/lib/middleware/requireWalletSignature';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { updateTrackUserProfile } from '@packages/metrics/mixpanel/updateTrackUserProfile';
import { extractSignupAnalytics } from '@packages/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from '@packages/metrics/userAcquisition/interfaces';
import { signupCookieNames } from '@packages/metrics/userAcquisition/interfaces';
import type { LoggedInUser } from '@packages/profile/getUser';
import { getUserProfile } from '@packages/profile/getUser';
import { createOrGetUserFromWallet } from '@packages/users/createUser';
import { updateUserProfile } from '@packages/users/updateUserProfile';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

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
        // remove from Loops
        await deleteLoopsContact({ email: original.email! });
      } else {
        await registerLoopsContact(updatedUser, original.email);
      }
    } catch (error) {
      log.error('Error updating contact with Loop', { error, userId });
    }
  }

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
