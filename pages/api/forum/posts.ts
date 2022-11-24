import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getForumPosts } from 'lib/forum/getForumPosts';
import type { ForumPost } from 'lib/forum/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPosts)
  .use(requireUser);

async function getPosts (req: NextApiRequest, res: NextApiResponse<ForumPost[]>) {
  const { spaceId, publicOnly } = req.query as any as AvailableResourcesRequest;

  const publicResourcesOnly = ((publicOnly as any) === 'true' || publicOnly === true);

  // Session may be undefined as non-logged in users can access this endpoint
  const userId = req.session?.user?.id;

  const posts = await getForumPosts({
    spaceId: spaceId as string,
    userId: publicResourcesOnly ? undefined : userId
  });

  return res.status(200).json(posts);
}

export default withSessionRoute(handler);
