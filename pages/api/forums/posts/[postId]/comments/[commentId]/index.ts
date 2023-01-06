import type { PostComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import { getPostComment } from 'lib/forums/comments/getPostComment';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler).delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostComment>) {
  const { commentId, postId } = req.query as any as { postId: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  const comment = await getPostComment(commentId);

  if (comment?.createdBy !== userId) {
    throw new UnauthorisedActionError();
  }

  if (comment.deletedAt) {
    throw new UndesirableOperationError("Can't edit deleted comments");
  }

  const postComment = await updatePostComment({ commentId, ...body });

  res.status(200).json(postComment);
}

async function deletePostCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { commentId, postId } = req.query as any as { postId: string; commentId: string };
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  const postComment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: {
      post: {
        select: {
          spaceId: true
        }
      }
    }
  });

  if (!postComment) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found`);
  }

  if (postComment?.createdBy !== userId) {
    const { error } = await hasAccessToSpace({
      spaceId: postComment.post.spaceId,
      userId,
      adminOnly: true
    });

    if (error) {
      throw error;
    }
  }

  await deletePostComment({ commentId });

  res.status(200).end();
}

export default withSessionRoute(handler);
