import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(resetEvaluationAppealReviewEndpoint);

async function resetEvaluationAppealReviewEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const userId = req.session.user.id;

  const proposalEvaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    select: {
      result: true,
      appealedAt: true,
      proposal: {
        select: {
          archived: true,
          id: true
        }
      }
    }
  });
  const proposal = proposalEvaluation.proposal;

  if (proposal.archived) {
    throw new ActionNotPermittedError(`You cannot move an archived proposal to a different step.`);
  }

  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposal.id,
    userId
  });

  if (!proposalPermissions.evaluate_appeal) {
    throw new ActionNotPermittedError(`You don't have permission to review this appeal.`);
  }

  if (!proposalEvaluation.appealedAt) {
    throw new ActionNotPermittedError(`You cannot reset a review that has not been appealed.`);
  }

  if (proposalEvaluation.result) {
    throw new ActionNotPermittedError(`You cannot reset a review that has been completed.`);
  }

  await prisma.proposalEvaluationReview.deleteMany({
    where: {
      evaluationId,
      reviewerId: userId,
      appeal: true
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
