import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { getPendingGnosisTasks } from 'lib/gnosis/gnosis.tasks';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getGnosisTasks);

async function getGnosisTasks (req: NextApiRequest, res: NextApiResponse<GnosisSafeTasks[]>) {
  const userId = req.session.user.id;
  const gnosisTasks = await getPendingGnosisTasks(userId);
  return res.status(200).json(gnosisTasks);
}

export default withSessionRoute(handler);
