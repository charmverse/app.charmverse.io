import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { refreshENSName } from 'lib/blockchain/refreshENSName';
import { isValidWalletSignature } from 'lib/blockchain/signAndVerify';
import { checkUserSpaceBanStatus } from 'lib/members/checkUserSpaceBanStatus';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getUserProfile } from 'lib/users/getUser';
import { shortenHex } from 'lib/utilities/blockchain';
import { InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(addWalletsController);

async function addWalletsController(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const userId = req.session.user.id;
  const addressesToAdd = req.body.addressesToAdd as AuthSig[];

  for (const addressToVerify of addressesToAdd) {
    if (
      !isValidWalletSignature({
        address: addressToVerify.address,
        signature: addressToVerify,
        host: req.headers.origin as string
      })
    ) {
      throw new InsecureOperationError('Could not verify wallet');
    }
  }

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
    walletAddresses: addressesToAdd.map((s) => s.address),
    spaceIds: userSpaceIds
  });

  if (isBannedFromSpace) {
    throw new InvalidInputError('You need to leave space before you can add this wallet to your account');
  }

  try {
    await prisma.userWallet.createMany({
      data: addressesToAdd.map((signature) => ({
        userId: req.session.user.id,
        address: signature.address.toLowerCase()
      }))
    });
  } catch (e) {
    log.error('Error adding wallet', e, { userId, addresses: addressesToAdd.map((s) => shortenHex(s.address)) });
    throw new InvalidInputError('Wallet is already connected with another account');
  }

  for (const authSig of addressesToAdd) {
    await refreshENSName({ userId, address: authSig.address });
  }

  const updatedProfile = await getUserProfile('id', userId);

  updateTrackUserProfile(updatedProfile);

  return res.status(200).json(updatedProfile);
}

export default withSessionRoute(handler);
