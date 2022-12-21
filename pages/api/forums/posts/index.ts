import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createForumPost } from 'lib/forums/posts/createForumPost';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import type { ListForumPostsRequest, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import { listForumPosts } from 'lib/forums/posts/listForumPosts';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .get(getPosts)
  .post(createForumPostController);

// TODO - Update posts
async function getPosts(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const postQuery = req.query as any as ListForumPostsRequest;
  const userId = req.session.user.id;
  const posts = await listForumPosts(postQuery, userId);

  return res.status(200).json(posts);
}

async function createForumPostController(req: NextApiRequest, res: NextApiResponse<ForumPostPage>) {
  const createdPage = await createForumPost({ ...req.body, createdBy: req.session.user.id });

  relay.broadcast(
    {
      type: 'post_published',
      payload: {
        createdBy: createdPage.createdBy,
        categoryId: createdPage.post.categoryId
      }
    },
    createdPage.spaceId
  );
  return res.status(201).json(createdPage);
}

export default withSessionRoute(handler);
