import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getBuildId);

async function getBuildId (req: NextApiRequest, res: NextApiResponse) {

  return res.status(200).json({ buildId: process.env.NEXT_PUBLIC_BUILD_ID });
}

export default withSessionRoute(handler);
