import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getForumPosts } from 'lib/forum/getForumPosts';
import type { ForumPost } from 'lib/forum/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

interface GetForumPostsRequest{
  spaceId: string;
  page?: number;
  count?: number;
  sort?: string;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPosts)
  .use(requireUser);

async function getPosts (req: NextApiRequest, res: NextApiResponse<ForumPost[]>) {
  const { spaceId, count, page, sort } = req.query as any as GetForumPostsRequest;

  const posts = await getForumPosts({
    spaceId,
    count,
    page,
    sort
  });

  return res.status(200).json(posts);
}

export default withSessionRoute(handler);
