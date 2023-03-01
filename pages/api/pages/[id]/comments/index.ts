import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { CreateCommentInput } from 'lib/comments';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { listPageComments } from 'lib/pages/comments/listPageComments';
import { PageNotFoundError } from 'lib/pages/server';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(listPageCommentsHandler).use(requireUser).post(createPageCommentHandler);

async function listPageCommentsHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote[]>) {
  const { id: pageId } = req.query as any as { id: string };

  const userId = req.session.user?.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  const pageCommentsWithVotes = await listPageComments({ pageId, userId });

  res.status(200).json(pageCommentsWithVotes);
}

async function createPageCommentHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote>) {
  const { id: pageId } = req.query as any as { id: string };
  const body = req.body as CreateCommentInput;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { spaceId: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to comment on this page');
  }

  const pageComment = await createPageComment({ pageId, userId, ...body });

  res.status(200).json({
    ...pageComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
