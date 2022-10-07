
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getSpaceInfoController);

async function getSpaceInfoController (req: NextApiRequest, res: NextApiResponse<Space | null>) {

  const { search } = req.query;

  const publicSpace = await getSpaceByDomain(search as string);

  return res.status(200).json(publicSpace);
}

export default withSessionRoute(handler);
