
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { logSignupViaWallet } from 'lib/metrics/postToDiscord';
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
  .use(requireUser)
  .get(getUser)
  .put(updateUser);

async function createUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {

  const { address } = req.body;

  let user: LoggedInUser;

  try {
    user = await getUserProfile('addresses', address);
  }
  catch {
    user = await createUserFromWallet(address);
    user.isNew = true;

    logSignupViaWallet();
  }

  req.session.user = { id: user.id };
  await updateGuildRolesForUser(user.wallets.map(w => w.address), user.spaceRoles);
  await req.session.save();

  res.status(200).json(user);
}

async function getUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const profile = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: sessionUserRelations
  });
  if (!profile) {
    return res.status(404).json({ error: 'No user found' });
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

