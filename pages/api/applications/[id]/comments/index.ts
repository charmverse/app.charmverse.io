import type { PageComment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { CreateApplicationCommentPayload } from 'lib/applications/interfaces';
import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createApplicationCommentController).get(getApplicationCommentsController);

async function createApplicationCommentController(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { contentText, content } = req.body as CreateApplicationCommentPayload;
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId
    }
  });

  if (!application) {
    throw new NotFoundError(`Application not found`);
  }

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: application.bountyId
    },
    select: {
      page: true,
      permissions: true,
      id: true
    }
  });

  const bountyId = bounty?.id;

  if (!bounty || !bounty.page) {
    throw new DataNotFoundError(`Application with id ${bountyId} not found.`);
  }

  const pagePermissions = await computeUserPagePermissions({
    resourceId: bounty.page.id,
    userId: req.session.user.id
  });

  if (pagePermissions.read !== true) {
    throw new DataNotFoundError(`Application with id ${bountyId} not found.`);
  }

  const pageComment = await prisma.pageComment.create({
    data: {
      content: content ?? Prisma.JsonNull,
      parentId: applicationId,
      pageId: bounty.page.id,
      contentText,
      createdBy: userId
    }
  });

  return res.status(201).json(pageComment);
}

async function getApplicationCommentsController(req: NextApiRequest, res: NextApiResponse<PageComment[]>) {
  const { id: userId } = req.session.user;
  const applicationId = req.query.id as string;

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId
    }
  });

  if (!application) {
    throw new NotFoundError(`Application not found`);
  }

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: application.bountyId
    },
    select: {
      page: true,
      permissions: true,
      id: true
    }
  });

  const bountyId = bounty?.id;

  if (!bounty || !bounty.page) {
    throw new DataNotFoundError(`Application with id ${bountyId} not found.`);
  }

  const pagePermissions = await computeUserPagePermissions({
    resourceId: bounty.page.id,
    userId
  });

  if (pagePermissions.read !== true) {
    throw new DataNotFoundError(`Application with id ${bountyId} not found.`);
  }

  const pageComment = await prisma.pageComment.findMany({
    where: {
      parentId: applicationId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.status(201).json(pageComment);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events assume the entity has been created
