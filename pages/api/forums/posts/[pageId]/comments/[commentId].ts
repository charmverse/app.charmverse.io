import type { PageComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import { getComment } from 'lib/forums/comments/getComment';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { checkPostAccess } from 'lib/forums/posts/checkPostAccess';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler).delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { pageId, commentId } = req.query as any as { pageId: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  await checkPostAccess({
    pageId,
    userId
  });

  const comment = await getComment(commentId);

  if (comment?.createdBy !== userId) {
    throw new UnauthorisedActionError();
  }

  const postComment = await updatePostComment({ commentId, ...body });

  res.status(200).json(postComment);
}

async function deletePostCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { pageId, commentId } = req.query as any as { pageId: string; commentId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    pageId,
    userId
  });

  await deletePostComment({ commentId, userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
