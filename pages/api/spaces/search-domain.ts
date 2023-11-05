import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceWithTokenGates } from 'lib/spaces/getSpaceWithTokenGates';
import type { SpaceWithGates } from 'lib/spaces/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getSpaceInfoController);

async function getSpaceInfoController(req: NextApiRequest, res: NextApiResponse<SpaceWithGates | null>) {
  const { search } = req.query;

  const publicSpace = await getSpaceWithTokenGates(search as string);

  return res.status(200).json(publicSpace);
}

export default withSessionRoute(handler);
