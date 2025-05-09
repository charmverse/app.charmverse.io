import { getAllUserCredentials } from '@packages/credentials/getAllUserCredentials';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(requireKeys(['userId'], 'query'), getCredentialsController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const includeTestnets = req.query.includeTestnets === 'true';

  const credentials = await getAllUserCredentials({ userId: req.query.userId as string, includeTestnets });
  return res.status(200).json(credentials);
}

export default withSessionRoute(handler);
