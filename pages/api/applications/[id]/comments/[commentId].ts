import type { PageComment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getApplicationDetails } from 'lib/applications/getApplicationDetails';
import type { CreateApplicationCommentPayload } from 'lib/applications/interfaces';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateApplicationCommentController);

async function updateApplicationCommentController(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { contentText, content } = req.body as CreateApplicationCommentPayload;
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;
  const commentId = req.query.commentId as string;

  const application = await getApplicationDetails(applicationId);

  if (!application) {
    throw new NotFoundError(`Application with id ${applicationId} not found`);
  }

  const bounty = application?.bounty;

  if (!bounty || !bounty.page) {
    throw new DataNotFoundError(`Bounty not found`);
  }

  const pagePermissions = await computeUserPagePermissions({
    resourceId: bounty.page.id,
    userId
  });

  const pageComment = await prisma.pageComment.findUnique({
    where: {
      id: commentId
    },
    select: {
      createdBy: true
    }
  });

  if (!pageComment) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found`);
  }

  if (pagePermissions.comment !== true || pageComment.createdBy !== userId) {
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

  return res.status(201).json(updatedPageComment);
}

export default withSessionRoute(handler);
