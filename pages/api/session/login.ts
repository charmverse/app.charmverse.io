import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';

import { trackUserAction, updateTrackUserProfile } from 'lib/metrics/mixpanel/server';
import { onError, onNoMatch, ActionNotPermittedError } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { Web3LoginRequest } from 'lib/middleware/requireWalletSignature';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireWalletSignature)
  .post(login);

async function login (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address } = req.body as Web3LoginRequest;

  const user = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address
        }
      }
    },
    include: sessionUserRelations
  });

  if (!user) {
    throw new ActionNotPermittedError('No user has been associated with this wallet address');
  }

  req.session.user = { id: user.id };
  await updateGuildRolesForUser(user.wallets.map(w => w.address), user.spaceRoles);
  await req.session.save();

  updateTrackUserProfile(user);
  trackUserAction('sign_in', { userId: user.id, identityType: 'Wallet' });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
