import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';

import { disconnectSpace } from 'lib/collabland/disconnectSpace';
import { requireKeys } from 'lib/middleware';
import { superApiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

const handler = superApiHandler();

handler.use(requireKeys([{ key: 'state', truthy: true }], 'body')).post(disconnectSpaceHandler);

async function disconnectSpaceHandler(req: NextApiRequest, res: NextApiResponse) {
  const { state } = req.body as { state: string };

  const disconnectedSpace = await disconnectSpace(state);
  log.info('Disconnected space to Collab.land', { spaceId: disconnectedSpace.id });

  return res.status(201).end();
}

export default withSessionRoute(handler);
