import type { PageComment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getApplicationDetails } from 'lib/applications/getApplicationDetails';
import type { CreateApplicationCommentPayload } from 'lib/applications/interfaces';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPageComment } from 'lib/pages/comments/getPageComment';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateApplicationCommentController).delete(deleteApplicationCommentController);

async function updateApplicationCommentController(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { contentText, content } = req.body as CreateApplicationCommentPayload;
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;
  const commentId = req.query.commentId as string;

  const application = await getApplicationDetails(applicationId);

  if (!application) {
    throw new NotFoundError(`Application with id ${applicationId} not found`);
  }

  const pageComment = await getPageComment(commentId);

  if (pageComment.createdBy !== userId) {
    throw new ActionNotPermittedError();
  }

  const updatedPageComment = await prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      content: content ?? Prisma.JsonNull,
      contentText
    }
  });

  return res.status(200).json(updatedPageComment);
}

async function deleteApplicationCommentController(req: NextApiRequest, res: NextApiResponse) {
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;
  const commentId = req.query.commentId as string;

  const application = await getApplicationDetails(applicationId);

  if (!application) {
    throw new NotFoundError(`Application with id ${applicationId} not found`);
  }

  const pageComment = await getPageComment(commentId);

  if (pageComment.createdBy !== userId) {
    throw new ActionNotPermittedError();
  }

  await prisma.pageComment.delete({
    where: {
      id: commentId
    }
  });

  return res.end();
}

export default withSessionRoute(handler);
