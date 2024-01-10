import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ReviewEvaluationRequest } from 'lib/proposal/submitEvaluationResult';
import { submitEvaluationResult } from 'lib/proposal/submitEvaluationResult';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['evaluationId', 'result'], 'body')).put(updateEvaluationResultEndpoint);

// for submitting a review or removing a previous one
async function updateEvaluationResultEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId, result } = req.body as ReviewEvaluationRequest;
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
      proposal: {
        select: {
          spaceId: true
        }
      }
    }
  });

  if (evaluation.type === 'feedback') {
    if (!proposalPermissions.move) {
      throw new ActionNotPermittedError(`You don't have permission to move this proposal.`);
    }
  } else if (!proposalPermissions.evaluate) {
    throw new ActionNotPermittedError(`You don't have permission to review this proposal.`);
  }
  if (!result) {
    throw new ActionNotPermittedError(`You must provide a result.`);
  }

  await submitEvaluationResult({
    proposalId,
    evaluationId,
    result,
    decidedBy: userId,
    spaceId: evaluation.proposal.spaceId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
