import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ReviewDecision } from 'lib/applications/actions';
import { reviewApplication } from 'lib/applications/actions';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['decision'], 'body'))
  .post(reviewUserApplication);

async function reviewUserApplication(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query as { id: string; decision: ReviewDecision };
  const { id: userId } = req.session.user;

  const application = await prisma.application.findUniqueOrThrow({
    where: {
      id: applicationId as string
    },
    select: {
      id: true,
      bountyId: true
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

  const reviewedApplication = await reviewApplication({
    applicationOrApplicationId: applicationId as string,
    userId,
    decision: req.body.decision
  });

  const rewardData = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: application.bountyId
    },
    select: {
      spaceId: true,
      id: true,
      customReward: true,
      rewardAmount: true,
      rewardToken: true
    }
  });

  trackUserAction('bounty_application_rejected', {
    userId,
    spaceId: rewardData.spaceId,
    rewardAmount: rewardData.rewardAmount,
    pageId: rewardData.id || '',
    rewardToken: rewardData.rewardToken,
    resourceId: rewardData.id,
    customReward: rewardData.customReward
  });

  return res.status(200).json(reviewedApplication);
}

export default withSessionRoute(handler);
