
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { approveApplication } from 'lib/applications/actions';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(approveUserApplication);

async function approveUserApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;

  const userId = req.session.user.id;

  const approvedApplication = await approveApplication({
    applicationOrApplicationId: applicationId as string,
    userId
  });

  return res.status(200).json(approvedApplication);
}

export default withSessionRoute(handler);
