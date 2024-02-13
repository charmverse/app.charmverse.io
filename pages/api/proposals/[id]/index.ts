import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposal } from 'lib/proposal/getProposal';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { updateProposal } from 'lib/proposal/updateProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalController).use(requireUser).put(updateProposalController);

async function getProposalController(req: NextApiRequest, res: NextApiResponse<ProposalWithUsersAndRubric>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user?.id as string | undefined;

  const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
    // Proposal id is the same as page
    resourceId: proposalId,
    userId
  });

  const proposal = await getProposal({ id: proposalId, permissionsByStep });

  if (!proposal.permissions?.view) {
    throw new NotFoundError();
  }

  return res.status(200).json(proposal);
}

async function updateProposalController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { authors, fields } = req.body as UpdateProposalRequest;

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

  await updateProposal({
    proposalId: proposal.id,
    authors,
    fields,
    selectedCredentialTemplates: req.body.selectedCredentialTemplates,
    actorId: userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
