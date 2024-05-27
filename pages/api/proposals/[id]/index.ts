import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { concealProposalSteps } from 'lib/proposals/concealProposalSteps';
import { getProposal } from 'lib/proposals/getProposal';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import type { UpdateProposalRequest } from 'lib/proposals/updateProposal';
import { updateProposal } from 'lib/proposals/updateProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalController).use(requireUser).put(updateProposalController);

async function getProposalController(req: NextApiRequest, res: NextApiResponse<ProposalWithUsersAndRubric>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user?.id as string | undefined;

  const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
    resourceId: proposalId,
    userId
  });

  const proposal = await getProposal({ id: proposalId, permissionsByStep });

  if (!proposal.permissions?.view) {
    throw new NotFoundError();
  }

  const proposalWithConcealedSteps = await concealProposalSteps({ proposal, userId });

  return res.status(200).json(proposalWithConcealedSteps);
}

async function updateProposalController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { authors, fields, projectId } = req.body as UpdateProposalRequest;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      reviewers: true,
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

  if (projectId) {
    const projectWithMembers = await prisma.project.findUnique({
      where: {
        id: projectId,
        projectMembers: {
          some: {
            userId
          }
        }
      }
    });

    // Only team members can update the proposal's connected project
    if (!projectWithMembers) {
      throw new ActionNotPermittedError(`You can't update this proposal.`);
    }
  }

  const newSelectedCredentialTemplates: string[] = req.body.selectedCredentialTemplates;
  const proposalCredentials: string[] = proposal.selectedCredentialTemplates ?? [];

  if (
    newSelectedCredentialTemplates &&
    !isAdmin &&
    (newSelectedCredentialTemplates.length !== proposalCredentials.length ||
      !newSelectedCredentialTemplates.every((id) => proposalCredentials.includes(id)))
  ) {
    throw new ActionNotPermittedError('You cannot change the selected credential templates');
  }

  await updateProposal({
    proposalId: proposal.id,
    authors,
    projectId,
    fields,
    selectedCredentialTemplates: newSelectedCredentialTemplates,
    actorId: userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
