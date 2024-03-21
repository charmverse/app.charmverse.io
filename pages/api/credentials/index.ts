import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getAllUserCredentials } from 'lib/credentials/getAllUserCredentials';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(requireKeys(['userId'], 'query'), getCredentialsController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getAllUserCredentials({ userId: req.query.userId as string });
  return res.status(200).json(credentials);
}

export default withSessionRoute(handler);
