import { InsecureOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { UpdateEvaluationRequest } from 'lib/proposal/updateProposalEvaluation';
import { updateProposalEvaluation } from 'lib/proposal/updateProposalEvaluation';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .put(updateEvaluationEndpoint);

async function updateEvaluationEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId, result, reviewers } = req.body as UpdateEvaluationRequest;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      reviewers: true,
      page: {
        select: {
          type: true
        }
      }
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  // Only admins can update proposal templates
  if (proposal.page?.type === 'proposal_template' && !isAdmin) {
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

  // We want to filter out only new reviewers so that we don't affect existing proposals
  if (proposal.page?.type === 'proposal' && (reviewers?.length || 0) > 0) {
    const newReviewers = (reviewers ?? []).filter(
      (updatedReviewer) =>
        !proposal.reviewers.some((proposalReviewer) => {
          return (
            proposalReviewer.roleId === updatedReviewer.roleId ||
            proposalReviewer.userId === updatedReviewer.userId ||
            proposalReviewer.systemRole === updatedReviewer.systemRole
          );
        })
    );
    if (newReviewers.length > 0) {
      const reviewerPool = await req.basePermissionsClient.proposals.getProposalReviewerPool({
        resourceId: proposal.categoryId as string
      });
      for (const reviewer of newReviewers) {
        if (reviewer.roleId && !reviewerPool.roleIds.includes(reviewer.roleId)) {
          const role = await prisma.role.findUnique({
            where: {
              id: reviewer.roleId
            },
            select: {
              name: true
            }
          });
          throw new InsecureOperationError(`${role?.name} role cannot be added as a reviewer to this proposal`);
        } else if (reviewer.userId && !reviewerPool.userIds.includes(reviewer.userId)) {
          const user = await prisma.user.findUnique({
            where: {
              id: reviewer.userId
            },
            select: {
              username: true
            }
          });
          throw new InsecureOperationError(`User ${user?.username} cannot be added as a reviewer to this proposal`);
        }
      }
    }
  }

  await updateProposalEvaluation({
    proposalId: proposal.id,
    evaluationId,
    result,
    decidedBy: result ? userId : undefined,
    voteSettings: req.body.voteSettings,
    reviewers
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
