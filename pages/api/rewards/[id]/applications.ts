import type { Application } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'bounty'
    })
  )
  .get(getRewardApplicationsController);

async function getRewardApplicationsController(req: NextApiRequest, res: NextApiResponse<Application[]>) {
  const { id: rewardId } = req.query as { id: string };

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: rewardId as string,
    userId: req.session.user?.id
  });

  if (!permissions.read) {
    throw new UnauthorisedActionError('You do not have permissions to view this reward.');
  }

  const applications = await prisma.application.findMany({
    where: {
      bountyId: rewardId
    }
  });

  res.status(200).json(applications);
}
export default withSessionRoute(handler);
