import { prisma } from '@charmverse/core/prisma-client';
import { AdministratorOnlyError } from '@packages/users/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { UpdateEvaluationRequest } from 'lib/proposals/updateProposalEvaluation';
import { updateProposalEvaluation } from 'lib/proposals/updateProposalEvaluation';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(updateEvaluationEndpoint);

async function updateEvaluationEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId, reviewers, requiredReviews, appealReviewers, finalStep, shareReviews, dueDate } =
    req.body as UpdateEvaluationRequest;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      evaluations: {
        select: {
          id: true,
          type: true,
          result: true,
          requiredReviews: true
        }
      },
      page: {
        select: {
          sourceTemplateId: true,
          type: true
        }
      }
    }
  });

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  // Only admins can update proposal templates or proposals made from a template
  if ((proposal.page?.type === 'proposal_template' || proposal.page?.sourceTemplateId) && !isAdmin) {
    throw new AdministratorOnlyError();
  }

  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposal.id,
    userId
  });

  if (!proposalPermissions.edit) {
    throw new ActionNotPermittedError(`You can't update this proposal.`);
  }

  const currentEvaluation = proposal.evaluations.find((e) => e.id === evaluationId);
  if (currentEvaluation?.requiredReviews !== requiredReviews && !!currentEvaluation?.result) {
    throw new ActionNotPermittedError('Cannot change the number of required reviews for a completed evaluation');
  }

  await updateProposalEvaluation({
    currentEvaluationType: currentEvaluation?.type,
    proposalId: proposal.id,
    evaluationId,
    voteSettings: req.body.voteSettings,
    reviewers,
    evaluationApprovers: req.body.evaluationApprovers,
    actorId: userId,
    requiredReviews,
    spaceId: proposal.spaceId,
    appealReviewers,
    finalStep,
    shareReviews,
    dueDate
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
