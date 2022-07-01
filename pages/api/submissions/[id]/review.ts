
import { Application } from '@prisma/client';
import { prisma } from 'db';
import { reviewSubmission, SubmissionReview } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { hasAccessToSpace, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { computeBountyPermissions } from 'lib/permissions/bounties';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<Pick<SubmissionReview, 'decision'>>(['decision'], 'body'))
  .post(reviewSubmissionController);

async function reviewSubmissionController (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: submissionId } = req.query;

  const userId = req.session.user.id;

  const submission = await prisma.application.findUnique({
    where: {
      id: submissionId as string
    },
    select: {
      bounty: true
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
    decision: req.body.decision,
    submissionId: submissionId as string,
    userId
  });

  rollupBountyStatus(updatedSubmission.bountyId);

  return res.status(200).json(updatedSubmission);
}

export default withSessionRoute(handler);
