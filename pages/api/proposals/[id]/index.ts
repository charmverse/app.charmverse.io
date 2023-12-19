import { InsecureOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { mapDbProposalToProposal } from 'lib/proposal/mapDbProposalToProposal';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { updateProposal } from 'lib/proposal/updateProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .put(updateProposalController)
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
      page: { select: { sourceTemplateId: true } },
      reviewers: true,
      rewards: true
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }
  // TODO: use Mo's new core permissions client
  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
    // Proposal id is the same as page
    resourceId: proposal?.id,
    userId
  });

  if (permissions.view !== true) {
    // TODO: use Mo's new core permissions client
    const pagePermissions = await req.basePermissionsClient.pages.computePagePermissions({
      // Proposal id is the same as page
      resourceId: proposal?.id,
      userId
    });
    if (pagePermissions.read !== true) {
      throw new NotFoundError();
    }
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId
  });

  const canSeeAnswers = spaceRole?.isAdmin || permissions.evaluate || permissions.review;
  if (!canSeeAnswers) {
    proposal.draftRubricAnswers = [];
    proposal.rubricAnswers = [];
    proposal.evaluations.forEach((evaluation) => {
      evaluation.draftRubricAnswers = [];
      evaluation.rubricAnswers = [];
    });
  }

  return res.status(200).json(mapDbProposalToProposal({ proposal, permissions }));
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
  const proposalPermissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
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
          return updatedReviewer.group === 'role'
            ? proposalReviewer.roleId === updatedReviewer.id
            : proposalReviewer.userId === updatedReviewer.id;
        })
    );
    if (newReviewers.length > 0) {
      const reviewerPool = await req.basePermissionsClient.proposals.getProposalReviewerPool({
        resourceId: proposal.categoryId as string
      });
      for (const reviewer of newReviewers) {
        if (reviewer.group === 'role' && !reviewerPool.roleIds.includes(reviewer.id)) {
          const role = await prisma.role.findUnique({
            where: {
              id: reviewer.id
            },
            select: {
              name: true
            }
          });
          throw new InsecureOperationError(`${role?.name} role cannot be added as a reviewer to this proposal`);
        } else if (reviewer.group === 'user' && !reviewerPool.userIds.includes(reviewer.id)) {
          const user = await prisma.user.findUnique({
            where: {
              id: reviewer.id
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
