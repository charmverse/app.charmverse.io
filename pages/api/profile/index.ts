import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { logSignupViaWallet } from 'lib/metrics/postToDiscord';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { signupCookieNames } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(requireWalletSignature, createUser)
  .get(getUser)
  .use(requireUser)
  .put(updateUser);

async function createUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {

  const { address } = req.body;

  let user: LoggedInUser;

  try {
    user = await getUserProfile('addresses', address);
  }
  catch {

    const cookiesToParse = req.cookies as Record<SignupCookieType, string>;

    const signupAnalytics = extractSignupAnalytics(cookiesToParse);

    user = await createUserFromWallet(address, signupAnalytics, req.session.anonymousUserId);
    user.isNew = true;

    logSignupViaWallet();
  }

  // Null out the anonmyous user id after successful login

  req.session.anonymousUserId = undefined;
  req.session.user = { id: user.id };
  await updateGuildRolesForUser(user.wallets.map(w => w.address), user.spaceRoles);
  await req.session.save();

  const cookies = new Cookies(req, res);

  signupCookieNames.forEach(cookie => {
    cookies.set(cookie, null);
  });

  res.status(200).json(user);
}

// Endpoint for a user to retrieve their own profile
async function getUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {

  async function handleNoProfile () {
    if (!req.session.anonymousUserId) {
      req.session.anonymousUserId = v4();
      await req.session.save();
    }
    return res.status(404).json({ error: 'No user found' });
  }

  if (!req.session?.user?.id) {
    return handleNoProfile();
  }

  const profile = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: sessionUserRelations
  });

  if (!profile) {
    return handleNoProfile();
  }

  // Clean up the anonymous id if the user has a profile
  if (req.session.anonymousUserId) {
    req.session.anonymousUserId = undefined;

    await req.session.save();
  }

  return res.status(200).json(profile);
}

async function updateUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {

  let user: LoggedInUser;

  if (req.body.addresses) {
    for (const address of req.body.addresses) {
      await prisma.userWallet.createMany({
        data: [{
          userId: req.session.user.id,
          address
        }]
      });
    }
    user = await getUserProfile('id', req.session.user.id);
  }
  else {
    user = await prisma.user.update({
      where: {
        id: req.session.user.id
      },
      include: sessionUserRelations,
      data: {
        ...req.body
      }
    });
  }

  updateTrackUserProfile(user);

  return res.status(200).json(user);
}

export default withSessionRoute(handler);

