import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ApplicationWithTransactions } from 'lib/applications/actions';
import { createApplication } from 'lib/applications/actions';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getApplications)
  .use(requireKeys<Application>(['bountyId', 'message'], 'body'))
  .post(createApplicationController);

async function getApplications(req: NextApiRequest, res: NextApiResponse<ApplicationWithTransactions[]>) {
  const resourceId = (req.query.bountyId || req.query.rewardId) as string;
  const { id: userId } = req.session.user;

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${resourceId} not found`);
  }

  const { error } = await hasAccessToSpace({
    adminOnly: false,
    spaceId: bounty.spaceId,
    userId
  });

  if (error) {
    throw error;
  }

  const applicationsOrSubmissions = await prisma.application.findMany({
    where: {
      bountyId: resourceId
    },
    include: {
      transactions: true
    }
  });

  return res.status(200).json(applicationsOrSubmissions);
}

async function createApplicationController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { bountyId, message } = req.body;

  // Get the space ID so we can make sure requester has access
  const bounty = await prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    select: {
      approveSubmitters: true,
      spaceId: true,
      rewardAmount: true,
      rewardToken: true,
      page: true,
      customReward: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId}`);
  }

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    resourceId: bountyId,
    userId
  });

  if (!permissions.work) {
    throw new UnauthorisedActionError(
      `You do not have the permission to ${bounty.approveSubmitters === true ? 'apply' : 'submit work'} to this bounty`
    );
  }

  const createdApplication = await createApplication({
    bountyId,
    message,
    userId: req.session.user.id
  });

  const { spaceId, rewardAmount, rewardToken, page, customReward } = bounty;
  trackUserAction('bounty_application', {
    userId,
    spaceId,
    pageId: page?.id || '',
    rewardAmount,
    rewardToken,
    resourceId: bountyId,
    customReward
  });

  return res.status(201).json(createdApplication);
}

export default withSessionRoute(handler);
