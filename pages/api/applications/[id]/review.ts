
import { Application } from '@prisma/client';
import { ReviewDecision, ReviewDecisionRequest, reviewSubmission } from 'lib/applications/actions';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<Pick<ReviewDecisionRequest, 'decision'>>(['decision'], 'body'))
  .post(reviewApplication);

async function reviewApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;

  const userId = req.session.user.id;

  const decision: ReviewDecision = req.body.decision;

  const updatedApplication = await reviewSubmission({
    applicationOrApplicationId: applicationId as string,
    decision,
    userId
  });

  return res.status(200).json(updatedApplication);
}

export default withSessionRoute(handler);
