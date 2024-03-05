import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { refreshENSName } from 'lib/blockchain/refreshENSName';
import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import { checkUserSpaceBanStatus } from 'lib/members/checkUserSpaceBanStatus';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { withSessionRoute } from 'lib/session/withSession';
import { getUserProfile } from 'lib/users/getUser';
import { shortenHex } from 'lib/utils/blockchain';
import { InvalidInputError } from 'lib/utils/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).use(requireWalletSignature).post(addWalletsController);

async function addWalletsController(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const userId = req.session.user.id;
  const payload = req.body as SignatureVerificationPayload;
  const walletAddress = payload.message.address.toLowerCase();

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      space: {
        select: {
          id: true
        }
      }
    }
  });
  const userSpaceIds = spaceRoles.map((role) => role.space.id);

  const isBannedFromSpace = await checkUserSpaceBanStatus({
    userId,
    walletAddresses: [walletAddress],
    spaceIds: userSpaceIds
  });

  if (isBannedFromSpace) {
    throw new InvalidInputError('You need to leave space before you can add this wallet to your account');
  }

  try {
    await prisma.userWallet.createMany({
      data: [
        {
          userId: req.session.user.id,
          address: walletAddress
        }
      ]
    });
  } catch (e) {
    log.error('Error adding wallet', e, { userId, address: shortenHex(walletAddress) });
    throw new InvalidInputError('Wallet is already connected with another account');
  }

  await refreshENSName({ userId, address: walletAddress });

  const updatedProfile = await getUserProfile('id', userId);

  updateTrackUserProfile(updatedProfile);

  return res.status(200).json(updatedProfile);
}

export default withSessionRoute(handler);
