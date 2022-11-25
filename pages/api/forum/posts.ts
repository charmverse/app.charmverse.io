import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getForumPosts } from 'lib/forum/getForumPosts';
import type { ForumPost } from 'lib/forum/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

import type { AvailableResourcesWithPaginationRequest } from './interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPosts)
  .use(requireUser);

async function getPosts (req: NextApiRequest, res: NextApiResponse<ForumPost[]>) {
  const { spaceId, publicOnly, count, page, sort } = req.query as any as AvailableResourcesWithPaginationRequest;

  const publicResourcesOnly = ((publicOnly as any) === 'true' || publicOnly === true);

  const userId = req.session?.user?.id;

  const posts = await getForumPosts({
    userId: publicResourcesOnly ? undefined : userId,
    spaceId,
    count,
    page,
    sort
  });

  return res.status(200).json(posts);
}

export default withSessionRoute(handler);
