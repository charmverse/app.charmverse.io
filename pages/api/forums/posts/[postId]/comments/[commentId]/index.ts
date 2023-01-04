import type { PostComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import { getPostComment } from 'lib/forums/comments/getPostComment';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler).delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostComment>) {
  const { commentId } = req.query as any as { postId: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

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
  const { commentId } = req.query as any as { postId: string; commentId: string };
  const userId = req.session.user.id;

  const postComment = await getPostComment(commentId);

  if (postComment?.createdBy !== userId) {
    throw new UnauthorisedActionError();
  }

  await deletePostComment({ commentId, userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
