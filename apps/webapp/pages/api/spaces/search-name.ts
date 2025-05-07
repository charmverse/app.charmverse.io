import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSpacesByName } from 'lib/spaces/getSpacesByName';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(requireKeys([{ key: 'search', valueType: 'truthy' }], 'query'), getSpaceInfoController);

async function getSpaceInfoController(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const { search } = req.query;

  const publicSpaces = await getSpacesByName(search as string);

  return res.status(200).json(publicSpaces);
}

export default withSessionRoute(handler);
