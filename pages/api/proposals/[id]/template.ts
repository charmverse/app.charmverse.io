import { prisma } from '@charmverse/core/prisma-client';
import { AdministratorOnlyError } from '@packages/users/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { applyProposalTemplate } from 'lib/proposals/applyProposalTemplate';
import type { ApplyTemplateRequest } from 'lib/proposals/applyProposalTemplate';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(applyTemplateEndpoint);

async function applyTemplateEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { templateId } = req.body as ApplyTemplateRequest;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      page: {
        select: {
          id: true,
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

  await applyProposalTemplate({
    proposalId: proposal.id,
    templateId,
    actorId: userId
  });

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: [{ id: proposal.page!.id, sourceTemplateId: templateId, spaceId: proposal.spaceId }]
    },
    proposal.spaceId
  );

  return res.status(200).end();
}

export default withSessionRoute(handler);
