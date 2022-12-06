import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { isValidWalletSignature } from 'lib/blockchain/signAndVerify';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { onError, onNoMatch } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { InsecureOperationError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { handleNoProfile } from './index';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(addWalletsController);

async function addWalletsController(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  let user: LoggedInUser & { addressesToAdd?: AuthSig[] };

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

  await prisma.userWallet.createMany({
    data: addressesToAdd.map((signature) => ({ userId: req.session.user.id, address: signature.address.toLowerCase() }))
  });

  const updatedProfile = (await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: sessionUserRelations
  })) as LoggedInUser;

  if (!updatedProfile) {
    return handleNoProfile(req, res);
  } else {
    user = updatedProfile;
  }

  updateTrackUserProfile(user);

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
