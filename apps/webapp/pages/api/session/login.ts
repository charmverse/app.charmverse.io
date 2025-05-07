import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import {
  trackOpSpaceClickSigninEvent,
  trackOpSpaceSuccessfulSigninEvent
} from '@packages/metrics/mixpanel/trackOpSpaceSigninEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { sessionUserRelations } from '@packages/profile/constants';
import type { LoggedInUser } from '@packages/profile/getUser';
import { DisabledAccountError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { refreshENSName } from '@packages/lib/blockchain/refreshENSName';
import type { SignatureVerificationPayload } from '@packages/lib/blockchain/signAndVerify';
import { updateGuildRolesForUser } from '@packages/lib/guild-xyz/server/updateGuildRolesForUser';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { requireWalletSignature } from '@packages/lib/middleware/requireWalletSignature';
import { withSessionRoute } from '@packages/lib/session/withSession';

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

  await trackOpSpaceClickSigninEvent({
    userId: user.id,
    identityType: 'Wallet'
  });

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

  await trackOpSpaceSuccessfulSigninEvent({
    userId: user.id,
    identityType: 'Wallet'
  });

  log.info(`User ${user.id} logged in with Wallet`, { userId: user.id, method: 'wallet' });

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
