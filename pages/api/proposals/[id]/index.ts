import { InsecureOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { canAccessPrivateFields } from 'lib/proposal/form/canAccessPrivateFields';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { mapDbProposalToProposal } from 'lib/proposal/mapDbProposalToProposal';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { updateProposal } from 'lib/proposal/updateProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .put(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }), updateProposalController)
  .get(getProposalController);

async function getProposalController(req: NextApiRequest, res: NextApiResponse<ProposalWithUsersAndRubric>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user?.id;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      draftRubricAnswers: true,
      rubricAnswers: true,
      rubricCriteria: {
        orderBy: {
          index: 'asc'
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          permissions: true,
          reviewers: true,
          rubricCriteria: true,
          rubricAnswers: true,
          draftRubricAnswers: true,
          vote: true
        }
      },
      authors: true,
      category: true,
      page: { select: { id: true, sourceTemplateId: true, type: true } },
      reviewers: true,
      rewards: true,
      form: {
        include: {
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      }
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    // Proposal id is the same as page
    resourceId: proposal?.id,
    userId
  });

  if (!proposalPermissions?.view) {
    throw new NotFoundError();
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId
  });

  const canSeeAnswers = spaceRole?.isAdmin || proposalPermissions.evaluate || proposalPermissions.review;
  if (!canSeeAnswers) {
    proposal.draftRubricAnswers = [];
    proposal.rubricAnswers = [];
    proposal.evaluations.forEach((evaluation) => {
      evaluation.draftRubricAnswers = [];
      evaluation.rubricAnswers = [];
    });
  }

  // If we are viewing a proposal template, we can see all private fields since the user might be creating a proposal
  const canAccessPrivateFormFields = await canAccessPrivateFields({ proposal, userId, proposalId: proposal.id });

  return res
    .status(200)
    .json(mapDbProposalToProposal({ proposal, permissions: proposalPermissions, canAccessPrivateFormFields }));
}

async function updateProposalController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { publishToLens, authors, reviewers, categoryId, evaluationType, fields } = req.body as UpdateProposalRequest;

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
    reviewers,
    categoryId,
    evaluationType,
    publishToLens,
    fields
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
