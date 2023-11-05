import { hasAccessToSpace } from '@charmverse/core/permissions';
import type { PageComment, ApplicationComment } from '@charmverse/core/prisma';
import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getApplicationDetails } from 'lib/applications/getApplicationDetails';
import type { CreateApplicationCommentPayload } from 'lib/applications/interfaces';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createApplicationCommentController).get(getApplicationCommentsController);

async function createApplicationCommentController(req: NextApiRequest, res: NextApiResponse<ApplicationComment>) {
  const { contentText, content, parentCommentId } = req.body as CreateApplicationCommentPayload;
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;

  const application = await prisma.application.findUniqueOrThrow({
    where: {
      id: applicationId
    },
    select: {
      id: true,
      bountyId: true,
      createdBy: true
    }
  });

  const permissions = await computeBountyPermissions({
    resourceId: application.bountyId,
    userId
  });

  if (!permissions.review && application.createdBy !== userId) {
    throw new ActionNotPermittedError(`Only reward reviewers and the creator of this submission can comment`);
  }

  const applicationComment = await prisma.applicationComment.create({
    data: {
      applicationId,
      createdBy: userId,
      parentId: parentCommentId,
      content: content ?? Prisma.JsonNull,
      contentText
    }
  });

  return res.status(201).json(applicationComment);
}

async function getApplicationCommentsController(req: NextApiRequest, res: NextApiResponse<ApplicationComment[]>) {
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;

  const application = await prisma.application.findUniqueOrThrow({
    where: {
      id: applicationId
    },
    select: {
      spaceId: true
    }
  });

  const { spaceRole } = await hasAccessToSpace({
    spaceId: application.spaceId,
    userId
  });

  if (!spaceRole) {
    throw new ActionNotPermittedError(`You don't have access to this space`);
  }

  const comments = await prisma.applicationComment.findMany({
    where: {
      applicationId
    }
  });

  return res.status(200).json(comments);
}

export default withSessionRoute(handler);
