import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getCeramicStreams } from 'lib/credentials/connectToCeramic';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getCredentialsController).post(attestController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getCeramicStreams();
  return res.status(200).json(credentials);
}

async function attestController(req: NextApiRequest, res: NextApiResponse) {
  // throw new InvalidInputError('This endpoint is blocked temporarily');

  // const streams = await getPinnedStreams();

  // const result = await parseCeramicRecord(req.body);
  // const result = await writeToCeramic(req.body);

  return res.status(200).json({ result: 'success' });
}

export default withSessionRoute(handler);
