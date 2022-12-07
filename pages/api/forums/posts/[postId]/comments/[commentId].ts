import type { PageComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { checkPostAccess } from 'lib/forums/posts/checkPostAccess';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler).delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { postId, commentId } = req.query as any as { postId: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  await checkPostAccess({
    postId,
    userId
  });

  const postComment = await updatePostComment({ commentId, userId, ...body });

  res.status(200).json(postComment);
}

async function deletePostCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { postId, commentId } = req.query as any as { postId: string; commentId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId,
    userId
  });

  await deletePostComment({ commentId, userId });

  res.status(200).json({});
}

export default withSessionRoute(handler);
