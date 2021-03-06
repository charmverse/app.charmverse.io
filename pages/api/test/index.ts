
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(createPermission);

async function createPermission (req: NextApiRequest, res: NextApiResponse) {

  return res.status(200).json({ message: 'test response' });
}

export default withSessionRoute(handler);
