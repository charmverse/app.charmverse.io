import type { NextApiRequest, NextApiResponse } from 'next';

import { connectSpace } from 'lib/collabland/connectSpace';
import { requireKeys } from 'lib/middleware';
import { superApiHandler } from 'lib/public-api/handler';
import type { SpaceApiResponse } from 'lib/public-api/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = superApiHandler();

handler
  .use(
    requireKeys(
      [
        { key: 'state', truthy: true },
        { key: 'discordServerId', truthy: true }
      ],
      'body'
    )
  )
  .post(connectSpaceHandler);

async function connectSpaceHandler(req: NextApiRequest, res: NextApiResponse<Promise<SpaceApiResponse>>) {
  const { state, discordServerId } = req.body as { state: string; discordServerId: string };

  const connectedSpace = connectSpace({ state, discordServerId });

  return res.status(201).json(connectedSpace);
}

export default withSessionRoute(handler);
