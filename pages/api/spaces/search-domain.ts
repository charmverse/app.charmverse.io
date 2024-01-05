import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceWithTokenGates } from 'lib/spaces/getSpaceWithTokenGates';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import { replaceS3Domain } from 'lib/utilities/url';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(requireKeys([{ key: 'search', valueType: 'truthy' }], 'query'), getSpaceInfoController);

async function getSpaceInfoController(req: NextApiRequest, res: NextApiResponse<SpaceWithGates | null>) {
  const { search } = req.query;

  const publicSpace = await getSpaceWithTokenGates(search as string);

  if (publicSpace?.spaceImage) {
    publicSpace.spaceImage = replaceS3Domain(publicSpace.spaceImage);
  }

  return res.status(200).json(publicSpace);
}

export default withSessionRoute(handler);
