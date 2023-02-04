import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { deleteForumPost } from 'lib/forums/posts/deleteForumPost';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import type { UpdateForumPostInput } from 'lib/forums/posts/updateForumPost';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requestOperations } from 'lib/permissions/requestOperations';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostController).put(updateForumPostController).delete(deleteForumPostController);

async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await requestOperations({
    resourceType: 'post',
    operations: ['edit_post'],
    resourceId: postId,
    userId
  });

  const existingPost = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      categoryId: true
    }
  });

  const newCategoryId = (req.body as UpdateForumPostInput).categoryId;

  // Don't allow an update to a new category ID if the user doesn't have permission to create posts in that category
  if (typeof newCategoryId === 'string' && existingPost?.categoryId !== newCategoryId) {
    await requestOperations({
      resourceType: 'post_category',
      operations: ['create_post'],
      resourceId: newCategoryId,
      userId
    });
  }

  const post = await updateForumPost(postId, req.body);

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
  res.status(200).end();
}

async function deleteForumPostController(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await requestOperations({
    resourceType: 'post',
    resourceId: postId,
    operations: ['delete_post'],
    userId
  });

  const post = await deleteForumPost(postId);

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

  res.status(200).end();
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const post = await getForumPost({ userId, postId });

  await requestOperations({
    resourceType: 'post',
    resourceId: post.id,
    operations: ['view_post'],
    userId
  });
  res.status(200).json(post);
}

export default withSessionRoute(handler);
