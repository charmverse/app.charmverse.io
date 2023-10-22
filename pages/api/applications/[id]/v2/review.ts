import { log } from '@charmverse/core/log';
import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { approveApplication } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { rollupRewardStatus } from 'lib/rewards/rollupRewardStatus';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['decision']))
  .post(reviewUserApplication);

async function reviewUserApplication(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;
  const { id: userId } = req.session.user;

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId as string
    },
    select: {
      id: true,
      bountyId: true,
      bounty: {
        select: {
          page: {
            select: {
              id: true
            }
          },
          spaceId: true,
          id: true,
          customReward: true,
          rewardAmount: true,
          rewardToken: true
        }
      }
    }
  });

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationId} not found`);
  }

  const permissions = await computeBountyPermissions({
    resourceId: application.bountyId,
    userId
  });

  if (!permissions.approve_applications) {
    throw new UnauthorisedActionError('You do not have the permission to approve applications for this bounty');
  }

  await prisma.application.update({
    where: {
      id: application.id
    },
    data: {
      status: req.body.decision === true ? 'inProgress' : 'rejected'
    }
  });

  const approvedApplication = await approveApplication({
    applicationOrApplicationId: applicationId as string,
    userId
  });

  await rollupRewardStatus({ rewardId: approvedApplication.bountyId });

  trackUserAction('bounty_application_accepted', {
    userId,
    spaceId: application.bounty.spaceId,
    rewardAmount: application.bounty.rewardAmount,
    pageId: application.bounty?.page?.id || '',
    rewardToken: application.bounty.rewardToken,
    resourceId: application.bountyId,
    customReward: application.bounty.customReward
  });

  return res.status(200).json(approvedApplication);
}

export default withSessionRoute(handler);
