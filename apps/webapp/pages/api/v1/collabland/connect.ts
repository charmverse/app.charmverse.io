import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';

import { connectSpace } from '@packages/lib/collabland/connectSpace';
import { requireKeys } from '@packages/lib/middleware';
import { superApiHandler } from 'lib/public-api/handler';
import type { SpaceApiResponse } from 'lib/public-api/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = superApiHandler();

handler
  .use(
    requireKeys(
      [
        { key: 'state', valueType: 'string' },
        { key: 'discordServerId', valueType: 'truthy' }
      ],
      'body'
    )
  )
  .post(connectSpaceHandler);

async function connectSpaceHandler(req: NextApiRequest, res: NextApiResponse<SpaceApiResponse>) {
  const { state, discordServerId } = req.body as { state: string; discordServerId: string };

  const connectedSpace = await connectSpace({ state, discordServerId });
  log.info('Connected space to Collab.Land', { spaceId: connectedSpace.id, discordServerId });

  return res.status(201).json(connectedSpace);
}

export default withSessionRoute(handler);
