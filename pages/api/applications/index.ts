
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getApplications)
  .use(requireKeys<Application>(['bountyId', 'createdBy'], 'body'))
  .post(createApplication);

async function getApplications (req: NextApiRequest, res: NextApiResponse<Application[]>) {
  const { bountyId } = req.query;

  if (bountyId === undefined) {
    throw new ApiError({
      message: 'Please provide a valid bounty ID',
      errorType: 'Invalid input'
    });
  }

  const ApplicationListQuery: Prisma.ApplicationFindManyArgs = {
    where: {
      bountyId: bountyId as string
    }
  };

  const applications = await prisma.application.findMany(ApplicationListQuery);
  return res.status(200).json(applications);
}

async function createApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const data = req.body as Application;
  const ApplicationToCreate = { ...data } as any;

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
