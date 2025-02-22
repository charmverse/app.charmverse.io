import { log } from '@charmverse/core/log';
import type { PageComment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { DataNotFoundError, UndesirableOperationError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { deletePageComment } from 'lib/pages/comments/deletePageComment';
import { getPageComment } from 'lib/pages/comments/getPageComment';
import { updatePageComment } from 'lib/pages/comments/updatePageComment';
import { isSpaceAdmin } from 'lib/permissions/isSpaceAdmin';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePageCommentHandler).delete(deletePageCommentHandler);

async function updatePageCommentHandler(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { commentId, id: pageId } = req.query as any as { id: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId }
  });

  if (!page) {
    throw new DataNotFoundError(pageId);
  }

  const comment = await getPageComment(commentId);

  if (comment?.createdBy !== userId) {
    throw new ActionNotPermittedError(`You cannot edit other peoples' comments`);
  }

  if (comment.deletedAt) {
    throw new UndesirableOperationError("Can't edit deleted comments");
  }

  const pageComment = await updatePageComment({ commentId, ...body });

  res.status(200).json(pageComment);
}

async function deletePageCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { commentId, id: pageId } = req.query as any as { id: string; commentId: string };
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId }
  });

  if (!page) {
    throw new DataNotFoundError(pageId);
  }

  const pageComment = await prisma.pageComment.findUnique({
    where: { id: commentId },
    include: {
      page: {
        select: {
          spaceId: true
        }
      }
    }
  });

  if (!pageComment) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found`);
  }

  const isAdmin = await isSpaceAdmin({ userId, spaceId: page.spaceId });

  if (pageComment.createdBy === userId || isAdmin) {
    await deletePageComment({ commentId, userId });
    log.info('User deleted a page comment', { commentId, pageId, userId });
  } else {
    throw new ActionNotPermittedError('You do not have permission to delete this comment.');
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
