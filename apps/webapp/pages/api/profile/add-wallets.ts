import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { refreshENSName } from '@packages/lib/blockchain/refreshENSName';
import type { SignatureVerificationPayload } from '@packages/lib/blockchain/signAndVerify';
import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { requireWalletSignature } from '@packages/lib/middleware/requireWalletSignature';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { updateTrackUserProfile } from '@packages/metrics/mixpanel/updateTrackUserProfile';
import type { LoggedInUser } from '@packages/profile/getUser';
import { shortenHex } from '@packages/utils/blockchain';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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
    await prisma.userWallet.create({
      data: {
        userId: req.session.user.id,
        address: walletAddress
      }
    });
  } catch (e) {
    log.error('Error adding wallet', e, { userId, address: shortenHex(walletAddress) });
    throw new InvalidInputError('Wallet is already connected with another account');
  }

  const updatedProfile = await refreshENSName({ userId, address: walletAddress });

  updateTrackUserProfile(updatedProfile);

  return res.status(200).json(updatedProfile);
}

export default withSessionRoute(handler);
