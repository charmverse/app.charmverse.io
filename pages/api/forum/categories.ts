import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getForumCategories } from 'lib/forum/getForumCategories';
import type { ForumPost } from 'lib/forum/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getCategories)
  .use(requireUser);

async function getCategories (req: NextApiRequest, res: NextApiResponse<string[]>) {
  const { spaceId, publicOnly } = req.query as any as AvailableResourcesRequest;

  const publicResourcesOnly = ((publicOnly as any) === 'true' || publicOnly === true);

  // Session may be undefined as non-logged in users can access this endpoint
  const userId = req.session?.user?.id;

  const categories = await getForumCategories({
    spaceId: spaceId as string,
    userId: publicResourcesOnly ? undefined : userId
  });

  return res.status(200).json(categories);
}

export default withSessionRoute(handler);
