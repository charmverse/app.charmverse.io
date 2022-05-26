
import { Application } from '@prisma/client';
import { approveApplication } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(approveUserApplication);

async function approveUserApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;

  const userId = req.session.user.id;

  const approvedApplication = await approveApplication({
    applicationOrApplicationId: applicationId as string,
    userId
  });

  rollupBountyStatus(approvedApplication.bountyId);

  return res.status(200).json(approvedApplication);
}

export default withSessionRoute(handler);
