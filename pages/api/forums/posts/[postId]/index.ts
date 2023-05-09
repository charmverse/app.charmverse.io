import { prisma } from '@charmverse/core';
import type { Post } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deleteForumPost } from 'lib/forums/posts/deleteForumPost';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import type { UpdateForumPostInput } from 'lib/forums/posts/updateForumPost';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishPostEvent } from 'lib/webhookPublisher/publishEvent';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'postId',
      location: 'query',
      resourceIdType: 'post'
    })
  )
  .get(getForumPostController)
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

    // Publish webhook event if needed
    await publishPostEvent({
      scope: WebhookEventNames.PostCreated,
      postId: post.id,
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

  const permissions = await req.basePermissionsClient.forum.computePostPermissions({
    resourceId: post.id,
    userId
  });

  if (!permissions.view_post) {
    throw new ActionNotPermittedError(`You do not have access to this post`);
  }

  res.status(200).json(post);
}

export default withSessionRoute(handler);
