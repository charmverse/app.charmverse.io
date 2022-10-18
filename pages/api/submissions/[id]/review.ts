
import type { Application } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { ReviewDecision, SubmissionReview } from 'lib/applications/actions';
import { reviewSubmission } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<Pick<SubmissionReview, 'decision'>>(['decision'], 'body'))
  .post(reviewSubmissionController);

async function reviewSubmissionController (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: submissionId } = req.query;
  const { decision } = req.body as { decision: ReviewDecision };

  const userId = req.session.user.id;

  const submission = await prisma.application.findUnique({
    where: {
      id: submissionId as string
    },
    select: {
      bounty: {
        include: {
          page: true
        }
      },
      status: true
    }
  });

  if (!submission) {
    throw new DataNotFoundError(`Submission with id ${submissionId} not found`);
  }

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: submission.bounty.id,
    userId
  });

  if (!permissions.review) {
    throw new UnauthorisedActionError('You cannot review submissions for this bounty');
  }

  const updatedSubmission = await reviewSubmission({
    decision,
    submissionId: submissionId as string,
    userId
  });

  await rollupBountyStatus(updatedSubmission.bountyId);

  const { spaceId, rewardAmount, rewardToken, id, page } = submission.bounty;
  if (decision === 'approve') {
    trackUserAction('bounty_submission_reviewed', { userId, spaceId, pageId: page?.id || '', resourceId: id });
  }
  else {
    if (submission.status === 'applied') {
      trackUserAction('bounty_application_rejected', { userId, spaceId, pageId: page?.id || '', rewardToken, rewardAmount, resourceId: id });
    }

    if (submission.status === 'review') {
      trackUserAction('bounty_submission_rejected', { userId, spaceId, pageId: page?.id || '', resourceId: id });
    }
  }

  return res.status(200).json(updatedSubmission);
}

export default withSessionRoute(handler);
