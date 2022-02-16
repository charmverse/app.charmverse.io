
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Contributor } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getContributors);

async function getContributors (req: NextApiRequest, res: NextApiResponse<Contributor[]>) {

  return res.status(200).json([]);
}

export default withSessionRoute(handler);
