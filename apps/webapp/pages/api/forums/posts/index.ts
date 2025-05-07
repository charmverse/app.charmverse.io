import type { Post } from '@charmverse/core/prisma';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { CreateForumPostInput } from '@packages/lib/forums/posts/createForumPost';
import { createForumPost, trackCreateForumPostEvent } from '@packages/lib/forums/posts/createForumPost';
import type { ListForumPostsRequest, PaginatedPostList } from '@packages/lib/forums/posts/listForumPosts';
import { listForumPosts } from '@packages/lib/forums/posts/listForumPosts';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { publishForumPostEvents } from '@packages/lib/notifications/publishForumPostEvents';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(
    providePermissionClients({
      key: 'spaceId',
      location: 'query',
      resourceIdType: 'space'
    }),
    getPosts
  )
  .post(
    requireUser,
    providePermissionClients({
      key: 'categoryId',
      location: 'body',
      resourceIdType: 'postCategory'
    }),
    createForumPostController
  );

async function getPosts(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const postQuery = req.query as any as ListForumPostsRequest;
  const userId = req.session.user?.id as string | undefined;

  const shouldApplyPermissions = req.spacePermissionsEngine === 'premium';

  if (shouldApplyPermissions) {
    // Apply permissions to what we are searching for
    postQuery.categoryId = (
      await req.premiumPermissionsClient.forum.mutatePostCategorySearch({
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

  const categoryId = (req.body as CreateForumPostInput).categoryId;

  const permissions = await req.basePermissionsClient.forum.computePostCategoryPermissions({
    resourceId: categoryId,
    userId
  });

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

    await publishForumPostEvents({
      content: createdPost.content as PageContent,
      createdBy: createdPost.createdBy,
      id: createdPost.id,
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
