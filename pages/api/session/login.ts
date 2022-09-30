import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { trackUserAction } from 'lib/metrics/mixpanel/server';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys(['address'], 'body'))
  .post(login);

async function login (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: sessionUserRelations
  });

  if (!user) {
    return res.status(401).send({ error: 'No user has been associated with this wallet address' });
  }

  req.session.user = { id: user.id };
  await updateGuildRolesForUser(user.addresses, user.spaceRoles);
  await req.session.save();

  trackUserAction('sign_in', { userId: user.id, identityType: 'Wallet' });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
