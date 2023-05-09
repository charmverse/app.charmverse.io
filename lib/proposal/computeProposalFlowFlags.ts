import { prisma, isProposalAuthor } from '@charmverse/core';
import { ProposalStatus } from '@charmverse/core/prisma';

import { BasePermissions } from 'lib/permissions/basePermissions.class';
import { computeProposalPermissions } from 'lib/permissions/proposals/computeProposalPermissions';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { typedKeys } from 'lib/utilities/objects';

import { ProposalNotFoundError } from './errors';
import type { ProposalWithUsers } from './interface';

export type ProposalFlowFlags = Record<ProposalStatus, boolean>;

type GetFlagsInput = { userId: string; proposal: ProposalWithUsers };

class TransitionFlags extends BasePermissions<ProposalStatus> {
  constructor() {
    super({ allowedOperations: typedKeys(ProposalStatus) });
  }
}

async function draftProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();
  const { isAdmin } = await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true });

  if (isProposalAuthor({ proposal, userId }) || isAdmin) {
    flags.addPermissions(['draft']);
    if (proposal.reviewers.length > 0) {
      flags.addPermissions(['discussion']);
    }
  }
  return flags.operationFlags;
}

async function discussionProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();
  if (
    isProposalAuthor({ proposal, userId }) ||
    (await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true })).isAdmin
  ) {
    flags.addPermissions(['draft']);

    if (proposal.reviewers.length > 0) {
      flags.addPermissions(['review']);
    }
  }
  return flags.operationFlags;
}
// Currently coupled to proposal permissions for review action
// In future, when reviewing action, and review status transition are decoupled, this will need to be updated
async function inReviewProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();

  const permissions = await computeProposalPermissions({
    resourceId: proposal.id,
    userId
  });

  if (permissions.review) {
    flags.addPermissions(['reviewed']);
  }

  if (isProposalAuthor({ proposal, userId })) {
    flags.addPermissions(['discussion']);
  }

  const isAdmin = (
    await hasAccessToSpace({
      spaceId: proposal.spaceId,
      userId
    })
  ).isAdmin;

  if (isAdmin) {
    flags.addPermissions(['discussion', 'reviewed']);
  }

  return flags.operationFlags;
}

// Currently coupled to proposal permissions for create_vote action
// In future, when create_vote action, and vote_active status transition are decoupled, this will need to be updated
async function reviewedProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();

  const permissions = await computeProposalPermissions({
    resourceId: proposal.id,
    userId
  });

  if (permissions.create_vote) {
    flags.addPermissions(['vote_active']);
  }

  return flags.operationFlags;
}
export async function computeProposalFlowFlags({
  proposalId,
  userId
}: {
  proposalId: string;
  userId: string;
}): Promise<ProposalFlowFlags> {
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(proposalId);
  }

  if (!userId) {
    return new TransitionFlags().empty;
  }

  switch (proposal.status) {
    case 'draft':
      return draftProposal({ proposal, userId });
    case 'discussion':
      return discussionProposal({ proposal, userId });
    case 'review':
      return inReviewProposal({ proposal, userId });
    case 'reviewed':
      return reviewedProposal({ proposal, userId });
    case 'vote_active':
    case 'vote_closed':
    default:
      return Promise.resolve(new TransitionFlags().empty);
  }
}
