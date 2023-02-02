import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { logSignupViaWallet } from 'lib/metrics/postToDiscord';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { signupCookieNames } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import { updateUserProfile } from 'lib/users/updateUserProfile';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(requireWalletSignature, createUser).get(getUser).use(requireUser).put(updateUser);

async function createUser(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address } = req.body;

  let user: LoggedInUser;

  try {
    user = await getUserProfile('addresses', address);
  } catch {
    const cookiesToParse = req.cookies as Record<SignupCookieType, string>;

    const signupAnalytics = extractSignupAnalytics(cookiesToParse);

    user = await createUserFromWallet({ address, id: req.session.anonymousUserId }, signupAnalytics);
    user.isNew = true;

    logSignupViaWallet();
  }

  // Null out the anonmyous user id after successful login

  req.session.anonymousUserId = undefined;
  req.session.user = { id: user.id };
  await updateGuildRolesForUser(
    user.wallets.map((w) => w.address),
    user.spaceRoles
  );
  await req.session.save();

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
async function getUser(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
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

  const updatedUser = await updateUserProfile(userId, req.body);

  updateTrackUserProfile(updatedUser);

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
