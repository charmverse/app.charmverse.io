import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateForumPostInput } from 'lib/forums/posts/createForumPost';
import { createForumPost, trackCreateForumPostEvent } from 'lib/forums/posts/createForumPost';
import type { ListForumPostsRequest, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import { listForumPosts } from 'lib/forums/posts/listForumPosts';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import {
  checkSpacePermissionsEngine,
  getPermissionsClient,
  premiumPermissionsApiClient
} from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishPostEvent } from 'lib/webhookPublisher/publishEvent';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(requireKeys<ListForumPostsRequest>(['spaceId'], 'query'), getPosts)
  .post(requireUser, requireKeys<CreateForumPostInput>(['categoryId'], 'body'), createForumPostController);

async function getPosts(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const postQuery = req.query as any as ListForumPostsRequest;
  const userId = req.session.user?.id as string | undefined;

  const shouldApplyPermissions =
    (await checkSpacePermissionsEngine({
      resourceId: postQuery.spaceId,
      resourceIdType: 'space'
    })) === 'private';

  if (shouldApplyPermissions) {
    // Apply permissions to what we are searching for
    postQuery.categoryId = (
      await premiumPermissionsApiClient.forum.mutatePostCategorySearch({
        spaceId: postQuery.spaceId,
        categoryId: postQuery.categoryId,
        userId
      })
    ).categoryId;
  }

  const posts = await listForumPosts(postQuery, userId);

  return res.status(200).json(posts);
}

async function createForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const userId = req.session.user.id;

  const categoryId = req.body.postCategoryId as string;
  const permissions = await getPermissionsClient({
    resourceId: req.body.categoryId,
    resourceIdType: 'post'
  }).then((client) =>
    client.forum.computePostCategoryPermissions({
      resourceId: categoryId,
      userId
    })
  );

  if (!permissions.create_post) {
    throw new ActionNotPermittedError(`You do not have permissions to create a post`);
  }

  const createdPost = await createForumPost({ ...req.body, createdBy: req.session.user.id });

  if (!createdPost.isDraft) {
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

    // Publish webhook event if needed
    await publishPostEvent({
      scope: WebhookEventNames.PostCreated,
      postId: createdPost.id,
      spaceId: createdPost.spaceId
    });
  }

  await trackCreateForumPostEvent({
    post: createdPost,
    userId: req.session.user.id
  });

  return res.status(201).json(createdPost);
}

export default withSessionRoute(handler);
