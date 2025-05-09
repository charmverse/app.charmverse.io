import type { Space } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSpaceByDomain } from '@packages/spaces/getSpaceByDomain';
import { replaceS3Domain } from '@packages/utils/url';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(requireKeys([{ key: 'search', valueType: 'truthy' }], 'query'), getSpaceInfoController);

async function getSpaceInfoController(req: NextApiRequest, res: NextApiResponse<Space | null>) {
  const { search } = req.query;

  const publicSpace = await getSpaceByDomain(search as string);

  if (publicSpace?.spaceImage) {
    publicSpace.spaceImage = replaceS3Domain(publicSpace.spaceImage);
  }

  return res.status(200).json(publicSpace);
}

export default withSessionRoute(handler);
