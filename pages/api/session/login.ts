import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { refreshENSName } from 'lib/blockchain/refreshENSName';
import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { DisabledAccountError } from 'lib/utils/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireWalletSignature).post(login);

async function login(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { otpRequired: true }>) {
  const { message } = req.body as SignatureVerificationPayload;
  // Address from the message is validated in requireWalletSignature middleware so we know the user address is valid
  const address = message.address.toLowerCase();

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

  if (user.deletedAt) {
    throw new DisabledAccountError();
  }

  await updateGuildRolesForUser(
    user.wallets.map((w) => w.address),
    user.spaceRoles
  );

  const updatedUser = await refreshENSName({ userId: user.id, address });

  if (user.otp?.activatedAt && !req.session.user?.id) {
    req.session.otpUser = { id: user.id, method: 'Wallet' };
    await req.session.save();

    return res.status(200).json({ otpRequired: true });
  }

  req.session.user = { id: user.id };
  await req.session.save();

  trackUserAction('sign_in', { userId: user.id, identityType: 'Wallet' });

  log.info(`User ${user.id} logged in with Wallet`, { userId: user.id, method: 'wallet' });

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
