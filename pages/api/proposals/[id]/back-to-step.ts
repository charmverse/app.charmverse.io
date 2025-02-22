import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { goBackToStep } from 'lib/proposals/goBackToStep';
import type { ReviewEvaluationRequest } from 'lib/proposals/submitEvaluationResult';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['evaluationId'], 'body')).put(updateEvaluationResultEndpoint);

// for submitting a review or removing a previous one
async function updateEvaluationResultEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId } = req.body as ReviewEvaluationRequest;

  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!proposalPermissions.move) {
    throw new ActionNotPermittedError(`You don't have permission to review this proposal.`);
  }
  await goBackToStep({
    proposalId,
    evaluationId,
    userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
