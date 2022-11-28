import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getForumCategories } from 'lib/forum/getForumCategories';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getCategories).use(requireUser);

async function getCategories(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const { spaceId } = req.query as any as AvailableResourcesRequest;

  const categories = await getForumCategories({
    spaceId: spaceId as string
  });

  return res.status(200).json(categories);
}

export default withSessionRoute(handler);
