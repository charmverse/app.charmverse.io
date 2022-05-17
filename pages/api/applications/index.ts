
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { DataNotFoundError } from 'lib/utilities/errors';
import { listSubmissions } from 'lib/applications/actions';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getApplications)
  .use(requireKeys<Application>(['bountyId', 'message'], 'body'))
  .post(createApplication);

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

async function createApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const data = req.body as Application;
  const ApplicationToCreate = {
    ...data,
    applicant: { connect: { id: req.session.user.id } },
    bounty: { connect: { id: data.bountyId } }
  } as Prisma.ApplicationCreateInput;

  delete (ApplicationToCreate as any).bountyId;

  const existingProposal = await prisma.application.findFirst({
    where: {
      bountyId: data.bountyId,
      createdBy: data.createdBy
    }
  });

  if (existingProposal) {
    throw new ApiError({
      message: 'This user has already applied to this bounty',
      errorType: 'Invalid input'
    });
  }

  const proposal = await prisma.application.create({ data: ApplicationToCreate });
  return res.status(200).json(proposal);
}

export default withSessionRoute(handler);
