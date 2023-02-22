import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import type { CreatePageCommentInput, PageCommentWithVote } from 'lib/pages/comments/interface';
import { listPageComments } from 'lib/pages/comments/listPageComments';
import { PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(listPageCommentsHandler).use(requireUser).post(createPageCommentHandler);

async function listPageCommentsHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote[]>) {
  const { id: pageId } = req.query as any as { id: string };

  const userId = req.session.user?.id;

  // TODO: permissions

  const pageCommentsWithVotes = await listPageComments({ pageId, userId });

  res.status(200).json(pageCommentsWithVotes);
}

async function createPageCommentHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote>) {
  const { id: pageId } = req.query as any as { id: string };
  const body = req.body as CreatePageCommentInput;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { spaceId: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // TODO: permissions

  const pageComment = await createPageComment({ pageId, userId, ...body });

  res.status(200).json({
    ...pageComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
