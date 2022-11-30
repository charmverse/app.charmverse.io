import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getForumPosts } from 'lib/forum/getForumPosts';
import type { ForumPost, ForumPostPage } from 'lib/forum/interfaces';
import { createForumPost } from 'lib/forums/posts/createForumPost';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export interface GetForumPostsRequest {
  spaceId: string;
  page?: number;
  count?: number;
  sort?: string;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .get(getPosts)
  .post(createForumPostController);

// TODO - Update posts
async function getPosts(req: NextApiRequest, res: NextApiResponse<ForumPost[]>) {
  const { spaceId, count, page, sort } = req.query as any as GetForumPostsRequest;

  const posts = await getForumPosts({
    spaceId,
    count,
    page,
    sort
  });

  return res.status(200).json(posts);
}

async function createForumPostController(req: NextApiRequest, res: NextApiResponse<ForumPostPage>) {
  const newPost = await createForumPost({ ...req.body, createdBy: req.session.user.id });

  return res.status(201).json(newPost);
}

export default withSessionRoute(handler);
