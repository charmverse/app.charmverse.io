import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ENSUserNameRefresh } from 'lib/blockchain/refreshENSName';
import { refreshENSName } from 'lib/blockchain/refreshENSName';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<ENSUserNameRefresh>(['address'], 'body'))
  .post(refreshENSNameController);

async function refreshENSNameController(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.body as ENSUserNameRefresh;

  const updatedUser = await refreshENSName({ userId: req.session.user.id, address });

  res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
