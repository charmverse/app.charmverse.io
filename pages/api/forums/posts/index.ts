import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateForumPostInput } from 'lib/forums/posts/createForumPost';
import { createForumPost, trackCreateForumPostEvent } from 'lib/forums/posts/createForumPost';
import type { ListForumPostsRequest, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import { listForumPosts } from 'lib/forums/posts/listForumPosts';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { mutatePostCategorySearch } from 'lib/permissions/forum/mutatePostCategorySearch';
import { requestOperations } from 'lib/permissions/requestOperations';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhook/interfaces';
import { publishPostEvent } from 'lib/webhook/publishEvent';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(requireKeys<ListForumPostsRequest>(['spaceId'], 'query'), getPosts)
  .post(requireUser, requireKeys<CreateForumPostInput>(['categoryId'], 'body'), createForumPostController);

// TODO - Update posts
async function getPosts(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const postQuery = req.query as any as ListForumPostsRequest;
  const userId = req.session.user?.id as string | undefined;

  // Apply permissions to what we are searching for
  postQuery.categoryId = (
    await mutatePostCategorySearch({ spaceId: postQuery.spaceId, categoryId: postQuery.categoryId, userId })
  ).categoryId;

  const posts = await listForumPosts(postQuery, userId);

  return res.status(200).json(posts);
}

async function createForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const userId = req.session.user.id;

  await requestOperations({
    resourceType: 'post_category',
    resourceId: req.body.categoryId as string,
    userId,
    operations: ['create_post']
  });

  const createdPost = await createForumPost({ ...req.body, createdBy: req.session.user.id });

  relay.broadcast(
    {
      type: 'post_published',
      payload: {
        createdBy: createdPost.createdBy,
        categoryId: createdPost.categoryId
      }
    },
    createdPost.spaceId
  );

  await trackCreateForumPostEvent({
    post: createdPost,
    userId: req.session.user.id
  });

  // Publish webhook event if needed
  await publishPostEvent({
    scope: WebhookEventNames.PostCreated,
    postId: createdPost.id,
    spaceId: createdPost.spaceId
  });

  return res.status(201).json(createdPost);
}

export default withSessionRoute(handler);
