import type { Application } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { refreshPaymentStatus } from 'lib/applications/actions/refreshPaymentStatus';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(refreshStatusHandler);

async function refreshStatusHandler(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;

  const updatedApplication = await refreshPaymentStatus(applicationId as string);

  return res.status(200).json(updatedApplication.application);
}

export default withSessionRoute(handler);
