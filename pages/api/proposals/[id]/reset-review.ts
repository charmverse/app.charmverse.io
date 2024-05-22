import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ReviewEvaluationRequest } from 'lib/proposals/submitEvaluationResult';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['evaluationId'], 'body')).put(resetReviewEndpoint);

async function resetReviewEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId } = req.body as ReviewEvaluationRequest;
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    select: {
      result: true,
      appealedAt: true,
      proposal: {
        select: {
          workflowId: true,
          archived: true,
          spaceId: true
        }
      }
    }
  });

  if (evaluation.proposal.archived) {
    throw new ActionNotPermittedError(`You cannot move an archived proposal to a different step.`);
  }

  if (!proposalPermissions.evaluate) {
    throw new ActionNotPermittedError(`You don't have permission to review this proposal.`);
  }

  if (evaluation.result) {
    throw new ActionNotPermittedError(`You cannot reset a review for a completed step.`);
  }

  if (evaluation.appealedAt) {
    throw new ActionNotPermittedError(`You cannot reset a review for a step that has been appealed.`);
  }

  await prisma.proposalEvaluationReview.deleteMany({
    where: {
      evaluationId,
      reviewerId: userId
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
