import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { UpdateWorkflowRequest } from '@packages/lib/proposals/applyProposalWorkflow';
import { applyProposalWorkflow } from '@packages/lib/proposals/applyProposalWorkflow';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { AdministratorOnlyError } from '@packages/users/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(updateWorkflowEndpoint);

async function updateWorkflowEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { workflowId } = req.body as UpdateWorkflowRequest;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      page: {
        select: {
          type: true
        }
      }
    }
  });
  if (proposal.status !== 'draft' && proposal.page?.type !== 'proposal_template') {
    throw new ActionNotPermittedError(`You can't update this proposal.`);
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

  const workflow = await prisma.proposalWorkflow.findUniqueOrThrow({
    where: {
      id: workflowId
    },
    select: {
      archived: true
    }
  });

  if (workflow.archived) {
    throw new ActionNotPermittedError(`You can't apply this workflow to this proposal.`);
  }

  await applyProposalWorkflow({
    proposalId: proposal.id,
    workflowId,
    actorId: userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
