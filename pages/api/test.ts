import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { restoreDoc } from 'scripts/replayPageHistory';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { ExtendedVote } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(restore);

// DELETE BEFORE MERGING
async function restore(req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  await restoreDoc();
  return res.status(200).end();
}

export default withSessionRoute(handler);
