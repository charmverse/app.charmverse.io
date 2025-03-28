import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { trackOpUserAction } from '@packages/metrics/mixpanel/trackOpUserAction';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { markSubmissionAsPaid } from 'lib/rewards/markSubmissionAsPaid';
import { rollupRewardStatus } from 'lib/rewards/rollupRewardStatus';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['applicationId']))
  .post(markSubmissionAsPaidController);

async function markSubmissionAsPaidController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const applicationId = req.query.applicationId ?? req.body.applicationId;

  const userId = req.session.user.id;

  const submission = await prisma.application.findUniqueOrThrow({
    where: {
      id: applicationId as string
    },
    select: {
      bounty: {
        select: {
          id: true,
          space: {
            select: {
              domain: true
            }
          },
          spaceId: true
        }
      }
    }
  });

  const permissions = await computeBountyPermissions({ resourceId: submission.bounty.id, userId });

  if (!permissions.review) {
    throw new UnauthorisedActionError('You cannot review submissions for this bounty');
  }

  const updatedSubmission = await markSubmissionAsPaid(applicationId as string);

  await rollupRewardStatus({
    rewardId: updatedSubmission.bountyId
  });

  await publishBountyEvent({
    scope: WebhookEventNames.RewardApplicationPaymentCompleted,
    bountyId: submission.bounty.id,
    spaceId: submission.bounty.spaceId,
    userId,
    applicationId
  });

  if (submission.bounty.space.domain === 'op-grants') {
    trackOpUserAction('reward_paid', {
      userId,
      rewardId: updatedSubmission.bountyId
    });
  }

  return res.status(200).json(updatedSubmission);
}

export default withSessionRoute(handler);
