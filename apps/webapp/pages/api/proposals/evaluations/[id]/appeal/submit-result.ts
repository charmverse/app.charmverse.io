import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { submitEvaluationAppealResult } from '@packages/lib/proposals/submitEvaluationAppealResult';
import type { ReviewEvaluationRequest } from '@packages/lib/proposals/submitEvaluationResult';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['result'], 'body')).put(submitEvaluationAppealResultEndpoint);

// for submitting a review or removing a previous one
async function submitEvaluationAppealResultEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const userId = req.session.user.id;
  const { result, declineReasons, declineMessage } = req.body as ReviewEvaluationRequest;

  const proposalEvaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    select: {
      id: true,
      result: true,
      appealable: true,
      appealedAt: true,
      appealRequiredReviews: true,
      appealReviews: true,
      proposal: {
        select: {
          archived: true,
          id: true,
          spaceId: true
        }
      }
    }
  });

  const existingEvaluationAppealReview = await prisma.proposalEvaluationAppealReview.findFirst({
    where: {
      evaluationId,
      reviewerId: userId
    },
    select: {
      result: true
    }
  });

  if (!proposalEvaluation.appealable) {
    throw new ActionNotPermittedError('This evaluation is not appealable.');
  }

  if (!proposalEvaluation.appealedAt) {
    throw new ActionNotPermittedError('Appeal has not been requested for this evaluation.');
  }

  const proposalId = proposalEvaluation.proposal.id;

  if (proposalEvaluation.proposal.archived) {
    throw new ActionNotPermittedError(`You cannot move an archived proposal to a different step.`);
  }

  if ((proposalEvaluation.appealRequiredReviews ?? 1) === proposalEvaluation.appealReviews.length) {
    throw new ActionNotPermittedError('This evaluation appeal has already been reviewed.');
  }

  if (proposalEvaluation.result) {
    throw new ActionNotPermittedError('This evaluation has already been reviewed.');
  }

  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!proposalPermissions.evaluate_appeal) {
    throw new ActionNotPermittedError(`You don't have permission to review this appeal.`);
  }

  if (!result) {
    throw new ActionNotPermittedError(`You must provide a result.`);
  }

  if (existingEvaluationAppealReview) {
    throw new ActionNotPermittedError('You have already reviewed this appeal.');
  }

  await submitEvaluationAppealResult({
    evaluation: proposalEvaluation,
    proposalId,
    result,
    decidedBy: userId,
    spaceId: proposalEvaluation.proposal.spaceId,
    declineReasons,
    declineMessage
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
