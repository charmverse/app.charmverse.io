import { log } from '@charmverse/core/log';
import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { approveApplication } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(approveUserApplication);

async function approveUserApplication(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;
  const { id: userId } = req.session.user;

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId as string
    },
    select: {
      bountyId: true,
      bounty: {
        include: { page: true }
      }
    }
  });

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationId} not found`);
  }

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: application.bountyId,
    userId
  });

  if (!permissions.approve_applications) {
    throw new UnauthorisedActionError('You do not have the permission to approve applications for this bounty');
  }

  const approvedApplication = await approveApplication({
    applicationOrApplicationId: applicationId as string,
    userId
  });

  await publishBountyEvent({
    applicationId: approvedApplication.id,
    bountyId: approvedApplication.bountyId,
    scope: WebhookEventNames.BountyApplicationAccepted,
    spaceId: application.bounty.spaceId
  });

  await rollupBountyStatus({
    bountyId: approvedApplication.bountyId,
    userId
  });
  const { id: bountyId, rewardAmount, rewardToken, spaceId, page, customReward } = application.bounty;
  trackUserAction('bounty_application_accepted', {
    userId,
    spaceId,
    rewardAmount,
    pageId: page?.id || '',
    rewardToken,
    resourceId: bountyId,
    customReward
  });

  return res.status(200).json(approvedApplication);
}

export default withSessionRoute(handler);
