
import { Application, Bounty, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requireKeys } from 'lib/middleware/requireKeys';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { IApiError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getApplications)
  .use(requireKeys<Application>(['bountyId', 'createdBy'], 'body'))
  .post(createApplication);

async function getApplications (req: NextApiRequest, res: NextApiResponse<Application[]>) {
  const { bountyId } = req.query;

  if (bountyId === undefined) {
    return res.status(400).send({ error: 'Please provide a valid bounty ID' } as any);
  }

  const ApplicationListQuery: Prisma.ApplicationFindManyArgs = {
    where: {
      bountyId: bountyId as string
    }
  };

  const applications = await prisma.application.findMany(ApplicationListQuery);
  return res.status(200).json(applications);
}

async function createApplication (req: NextApiRequest, res: NextApiResponse<Application | IApiError>) {
  const data = req.body as Application;
  const ApplicationToCreate = { ...data } as any;

  const existingProposal = await prisma.application.findFirst({
    where: {
      bountyId: data.bountyId,
      createdBy: data.createdBy
    }
  });

  if (existingProposal) {
    return res.status(400).json(<IApiError>{
      message: 'This user has already applied to this bounty'
    });
  }

  const proposal = await prisma.application.create({ data: ApplicationToCreate });
  return res.status(200).json(proposal);
}

export default withSessionRoute(handler);
