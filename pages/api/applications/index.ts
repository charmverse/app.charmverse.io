
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { DataNotFoundError } from 'lib/utilities/errors';
import { listSubmissions, createApplication } from 'lib/applications/actions';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getApplications)
  .use(requireKeys<Application>(['bountyId', 'message'], 'body'))
  .post(createApplicationController);

async function getApplications (req: NextApiRequest, res: NextApiResponse<Application[]>) {
  const { bountyId, submissionsOnly } = req.query;
  const { id: userId } = req.session.user;

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: bountyId as string
    },
    select: {
      spaceId: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const { error } = await hasAccessToSpace({
    adminOnly: false,
    spaceId: bounty.spaceId,
    userId
  });

  if (error) {
    throw error;
  }

  const applicationsOrSubmissions = await (submissionsOnly === 'true'
    ? listSubmissions(bountyId as string)
    : prisma.application.findMany({
      where: {
        bountyId: bountyId as string
      }
    }));
  return res.status(200).json(applicationsOrSubmissions);
}

async function createApplicationController (req: NextApiRequest, res: NextApiResponse<Application>) {

  const { bountyId, message } = req.body;

  // Get the space ID so we can make sure requester has access
  const bountySpaceId = await prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    select: {
      spaceId: true
    }
  });

  if (!bountySpaceId) {
    throw new DataNotFoundError(`Bounty with id ${bountyId}`);
  }

  const userId = req.session.user.id;

  const { error } = await hasAccessToSpace({
    spaceId: bountySpaceId.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw (error);
  }

  const createdApplication = await createApplication({
    bountyId,
    message,
    userId: req.session.user.id
  });

  return res.status(201).json(createdApplication);
}

export default withSessionRoute(handler);
