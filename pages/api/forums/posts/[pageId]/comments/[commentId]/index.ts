import type { PageComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import { getComment } from 'lib/forums/comments/getComment';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler).delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { pageId, commentId } = req.query as any as { pageId: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  const page = await getForumPost({ pageId, userId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  const comment = await getComment(commentId);

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
  const { pageId, commentId } = req.query as any as { pageId: string; commentId: string };
  const userId = req.session.user.id;

  const page = await getForumPost({ pageId, userId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  await deletePostComment({ commentId, userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
