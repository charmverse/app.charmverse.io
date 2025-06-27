import type { ApplicationComment } from '@charmverse/core/prisma';
import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/core/permissions';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateApplicationCommentPayload } from './index';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateApplicationCommentController).delete(deleteApplicationCommentController);

async function updateApplicationCommentController(req: NextApiRequest, res: NextApiResponse<ApplicationComment>) {
  const { contentText, content } = req.body as CreateApplicationCommentPayload;
  const { id: userId } = req.session.user;
  const commentId = req.query.commentId as string;
  const comment = await prisma.applicationComment.findFirstOrThrow({
    where: {
      id: commentId
    },
    select: {
      createdBy: true
    }
  });
  if (comment.createdBy !== userId) {
    throw new ActionNotPermittedError(`You can only edit comments you created`);
  }
  const updatedComment = await prisma.applicationComment.update({
    where: {
      id: commentId
    },
    data: {
      content: content ?? Prisma.JsonNull,
      contentText
    }
  });

  return res.status(200).json(updatedComment);
}

async function deleteApplicationCommentController(req: NextApiRequest, res: NextApiResponse<ApplicationComment>) {
  const { id: userId } = req.session.user;
  const applicationId = req.query.applicationId as string;
  const commentId = req.query.commentId as string;

  const application = await prisma.application.findFirstOrThrow({
    where: {
      id: applicationId
    },
    select: {
      spaceId: true,
      createdBy: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId: application.spaceId,
    userId
  });

  if (!spaceRole?.isAdmin && application.createdBy !== userId) {
    throw new ActionNotPermittedError(`You cannot delete this comment`);
  }
  const softDeletedComment = await prisma.applicationComment.update({
    where: {
      id: commentId
    },
    data: {
      deletedAt: new Date(),
      deletedBy: userId
    }
  });

  return res.status(200).send(softDeletedComment);
}

export default withSessionRoute(handler);
