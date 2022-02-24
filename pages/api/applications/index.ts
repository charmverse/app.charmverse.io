
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getApplications).post(createApplication);

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

  const bounties = await prisma.application.findMany(ApplicationListQuery);
  return res.status(200).json(bounties);
}

async function createApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const data = req.body as Application;
  const ApplicationToCreate = { ...data } as any;

  if (data.createdBy) {
    (ApplicationToCreate as Prisma.ApplicationCreateInput).applicant = { connect: { id: data.createdBy } };
    delete ApplicationToCreate.createdBy;
  }
  else {
    return res.status(400).json({ error: 'Please provide an applicant' } as any);
  }

  if (data.bountyId) {
    (ApplicationToCreate as Prisma.ApplicationCreateInput).bounty = { connect: { id: data.bountyId } };
    delete ApplicationToCreate.bountyId;
  }
  else {
    return res.status(400).json({ error: 'The proposal should be linked to a bounty' } as any);
  }

  const proposal = await prisma.application.create({ data: ApplicationToCreate });
  return res.status(200).json(proposal);
}

export default withSessionRoute(handler);
