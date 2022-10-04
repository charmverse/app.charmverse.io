import { getAddress, toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { onError, onNoMatch, requireKeys, ActionNotPermittedError } from 'lib/middleware';
import type { Web3LoginRequest } from 'lib/middleware/requireWalletSignature';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

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

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
