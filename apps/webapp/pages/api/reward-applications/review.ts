import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { DataNotFoundError, InvalidInputError, UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { computeBountyPermissions } from '@packages/lib/permissions/bounties';
import { reviewApplication } from '@packages/lib/rewards/reviewApplication';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['decision'], 'body'))
  .post(reviewUserApplication);

async function reviewUserApplication(req: NextApiRequest, res: NextApiResponse<Application>) {
  const applicationId = req.query?.applicationId ?? req.body.applicationId;

  if (!applicationId) {
    throw new InvalidInputError(`applicationId is required`);
  }

  const { id: userId } = req.session.user;

  const application = await prisma.application.findUnique({
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

  const permissions = await computeBountyPermissions({ resourceId: application.bountyId, userId });

  if (!permissions.approve_applications) {
    throw new UnauthorisedActionError('You do not have the permission to approve applications for this bounty');
  }

  const reviewedApplication = await reviewApplication({
    applicationId: applicationId as string,
    userId,
    decision: req.body.decision
  });

  const rewardData = await prisma.bounty.findUnique({
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

  if (!rewardData) {
    throw new DataNotFoundError(`Bounty with id ${application.bountyId} not found`);
  }

  // Adjusted the event name to be generic based on decision (approved/rejected)
  const event = req.body.decision === 'approve' ? 'bounty_application_accepted' : 'bounty_application_rejected';

  trackUserAction(event, {
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
