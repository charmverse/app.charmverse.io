import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { updateEvaluationResult } from 'lib/proposals/submitEvaluationResult';
import type { UpdateEvaluationRequest } from 'lib/proposals/updateProposalEvaluation';
import { updateProposalEvaluation } from 'lib/proposals/updateProposalEvaluation';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(updateEvaluationEndpoint);

async function updateEvaluationEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId, reviewers, requiredReviews } = req.body as UpdateEvaluationRequest;

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

  if (currentEvaluation?.type === 'pass_fail') {
    const existingEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
      where: {
        evaluationId
      },
      select: {
        result: true
      }
    });

    if (existingEvaluationReviews.length === requiredReviews) {
      await updateEvaluationResult({
        decidedBy: userId,
        evaluationId,
        existingEvaluationReviews,
        proposalId,
        spaceId: proposal.spaceId
      });
    }
  }

  await updateProposalEvaluation({
    proposalId: proposal.id,
    evaluationId,
    voteSettings: req.body.voteSettings,
    reviewers,
    actorId: userId,
    requiredReviews
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
