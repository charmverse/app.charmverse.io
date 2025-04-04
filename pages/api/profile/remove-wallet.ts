import type { UserWallet } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { DisconnectWalletRequest } from 'lib/users/disconnectWallet';
import { disconnectWallet } from 'lib/users/disconnectWallet';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys<DisconnectWalletRequest>(['address'], 'body'))
  .use(requireUser)
  .post(removeWalletController);

async function removeWalletController(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const userId = req.session.user.id;
  const address = req.body.address as UserWallet['address'];

  const loggedInUser = await disconnectWallet({ address, userId });

  await updateTrackUserProfile(loggedInUser);

  return res.status(200).json(loggedInUser);
}

export default withSessionRoute(handler);
