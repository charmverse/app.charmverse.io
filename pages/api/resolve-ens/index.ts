import { resolveENSName } from '@packages/blockchain/getENSName';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(resolveENSNameHandler);

async function resolveENSNameHandler(req: NextApiRequest, res: NextApiResponse) {
  const ens = req.query.ens as string;
  const address = await resolveENSName(ens);
  res.status(200).send(address);
}

export default withSessionRoute(handler);
