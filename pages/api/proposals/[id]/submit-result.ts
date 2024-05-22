import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ReviewEvaluationRequest } from 'lib/proposals/submitEvaluationResult';
import { submitEvaluationResult } from 'lib/proposals/submitEvaluationResult';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['evaluationId', 'result'], 'body')).put(updateEvaluationResultEndpoint);

// for submitting a review or removing a previous one
async function updateEvaluationResultEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId, result, declineReasons } = req.body as ReviewEvaluationRequest;
  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    include: {
      reviews: {
        select: {
          result: true,
          reviewerId: true
        }
      },
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

  if (!result) {
    throw new ActionNotPermittedError(`You must provide a result.`);
  }

  if (evaluation.result === result) {
    log.debug('Evaluation result is the same', { proposalId, evaluationId, result });
    return res.status(200).end();
  }

  const hasCurrentReviewerReviewed = evaluation.reviews.some((r) => r.reviewerId === userId);
  if (hasCurrentReviewerReviewed) {
    throw new ActionNotPermittedError('You have already reviewed this evaluation');
  }

  await submitEvaluationResult({
    evaluation,
    proposalId,
    result,
    decidedBy: userId,
    spaceId: evaluation.proposal.spaceId,
    declineReasons
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
