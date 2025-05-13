import { prisma, type Application } from '@charmverse/core/prisma-client';
import { findSpaceIssuableRewardCredentials } from '@packages/credentials/findIssuableRewardCredentials';
import { getProposalOrApplicationCredentials } from '@packages/credentials/getProposalOrApplicationCredentials';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import { computeBountyPermissions } from '@packages/lib/permissions/bounties';
import type { ApplicationWithTransactions } from '@packages/lib/rewards/interfaces';
import { work } from '@packages/lib/rewards/work';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(
    providePermissionClients({
      key: 'rewardId',
      location: 'body',
      resourceIdType: 'bounty'
    }),
    workOnRewardController
  )
  .get(requireKeys(['applicationId'], 'query'), getApplicationController);

async function workOnRewardController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const applicationId = req.query.applicationId ?? req.body.applicationId;
  const userId = req.session.user.id;

  // Check user's permission before applying to a reward.
  const rewardPermissions = await computeBountyPermissions({ resourceId: req.body.rewardId, userId });

  if (!rewardPermissions.work) {
    throw new UnauthorisedActionError('You do not have permissions to work on this reward.');
  }

  const applicationResponse = await work({ ...req.body, applicationId, userId });

  res.status(200).json(applicationResponse);
}

async function getApplicationController(req: NextApiRequest, res: NextApiResponse<ApplicationWithTransactions>) {
  const applicationId = req.query.applicationId as string;

  const application = await prisma.application.findUniqueOrThrow({
    where: {
      id: applicationId
    },
    include: {
      transactions: true
    }
  });

  const rewardPage = await prisma.page.findUniqueOrThrow({
    where: {
      bountyId: application.bountyId
    },
    select: {
      id: true
    }
  });

  const pagePermissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: rewardPage.id,
    userId: req.session.user?.id
  });

  if (!pagePermissions.read) {
    throw new ActionNotPermittedError(`You cannot access this application`);
  }

  const applicationCredentials = await getProposalOrApplicationCredentials({
    applicationId: application.id
  });

  const pendingOnchainApplicationCredentials = await findSpaceIssuableRewardCredentials({
    applicationId: application.id,
    spaceId: application.spaceId
  });

  return res.status(200).json({
    ...application,
    issuedCredentials: applicationCredentials,
    issuableOnchainCredentials: pendingOnchainApplicationCredentials
  });
}

export default withSessionRoute(handler);
