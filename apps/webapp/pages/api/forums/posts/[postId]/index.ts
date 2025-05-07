import { log } from '@charmverse/core/log';
import type { Post } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deleteForumPost } from '@packages/lib/forums/posts/deleteForumPost';
import { getForumPost } from '@packages/lib/forums/posts/getForumPost';
import type { UpdateForumPostInput } from '@packages/lib/forums/posts/updateForumPost';
import { updateForumPost } from '@packages/lib/forums/posts/updateForumPost';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { publishForumPostEvents } from '@packages/lib/notifications/publishForumPostEvents';
import { getPermissionsClient } from '@packages/lib/permissions/api';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getForumPostController)
  .use(
    providePermissionClients({
      key: 'postId',
      location: 'query',
      resourceIdType: 'post'
    })
  )
  .use(requireUser)
  .put(updateForumPostController)
  .delete(deleteForumPostController);

async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.forum.computePostPermissions({
    resourceId: postId,
    userId
  });

  if (!permissions.edit_post) {
    throw new ActionNotPermittedError(`You cannot edit this post`);
  }

  const existingPost = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId
    },
    select: {
      categoryId: true,
      isDraft: true
    }
  });

  if (!existingPost.isDraft && req.body.isDraft) {
    throw new ActionNotPermittedError(`You cannot convert a published post to a draft`);
  }

  const newCategoryId = (req.body as UpdateForumPostInput).categoryId;

  // Don't allow an update to a new category ID if the user doesn't have permission to create posts in that category
  if (typeof newCategoryId === 'string' && existingPost.categoryId !== newCategoryId) {
    const categoryPermissions = await req.basePermissionsClient.forum.computePostCategoryPermissions({
      resourceId: newCategoryId,
      userId
    });

    if (!categoryPermissions.create_post) {
      throw new ActionNotPermittedError(`You cannot change the post category to this new category`);
    }
  }

  const post = await updateForumPost(postId, req.body);

  // Updating un-drafted posts
  if (!post.isDraft && !existingPost.isDraft) {
    relay.broadcast(
      {
        type: 'post_updated',
        payload: {
          id: postId,
          createdBy: post.createdBy,
          categoryId: post.categoryId
        }
      },
      post.spaceId
    );
  } else if (!post.isDraft && existingPost.isDraft) {
    // Publishing an un-drafted post
    relay.broadcast(
      {
        type: 'post_published',
        payload: {
          createdBy: post.createdBy,
          categoryId: post.categoryId
        }
      },
      post.spaceId
    );

    await publishForumPostEvents({
      content: post.content as PageContent,
      createdBy: post.createdBy,
      id: post.id,
      spaceId: post.spaceId
    });
  }

  res.status(200).end();
}

async function deleteForumPostController(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.forum.computePostPermissions({
    resourceId: postId,
    userId
  });

  if (!permissions.delete_post) {
    throw new ActionNotPermittedError(`You cannot delete this post`);
  }

  const post = await deleteForumPost(postId);

  log.info('Post deleted', { postId, userId });

  if (!post.isDraft) {
    relay.broadcast(
      {
        type: 'post_deleted',
        payload: {
          id: postId,
          categoryId: post.categoryId
        }
      },
      post.spaceId
    );
  }

  res.status(200).end();
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId, spaceDomain } = req.query as any as { postId: string; spaceDomain?: string };
  const userId = req.session.user?.id;

  const post = await getForumPost({ userId, postId, spaceDomain });

  const permissions = await getPermissionsClient({ resourceId: post.id, resourceIdType: 'post' }).then(({ client }) =>
    client.forum.computePostPermissions({
      resourceId: post.id,
      userId
    })
  );

  if (!permissions.view_post) {
    throw new ActionNotPermittedError(`You do not have access to this post`);
  }

  res.status(200).json(post);
}

export default withSessionRoute(handler);
