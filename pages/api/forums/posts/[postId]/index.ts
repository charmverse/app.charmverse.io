import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { canEditPost } from 'lib/forums/posts/canEditPost';
import { deleteForumPost } from 'lib/forums/posts/deleteForumPost';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostController).put(updateForumPostController).delete(deleteForumPostController);

async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const canEdit = await canEditPost({
    postId,
    userId
  });

  if (!canEdit) {
    throw new UnauthorisedActionError(`User ${userId} cannot edit post ${postId}`);
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

  const canDelete = await canEditPost({
    postId,
    userId
  });

  if (!canDelete) {
    throw new UnauthorisedActionError(`User ${userId} cannot edit post ${postId}`);
  }

  await deleteForumPost(postId);

  res.status(200).end();
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const post = await getForumPost({ userId, postId });

  const { error } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  if (error) {
    throw error;
  }

  res.status(200).json(post);
}

export default withSessionRoute(handler);
