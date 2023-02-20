import { ProposalStatus } from '@prisma/client';

import { prisma } from 'db';
import { BasePermissions } from 'lib/permissions/basePermissions.class';
import { hasSpaceWideProposalReviewerPermission } from 'lib/permissions/proposals/hasSpaceWideProposalReviewerPermission';
import { isProposalAuthor } from 'lib/proposal/isProposalAuthor';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { typedKeys } from 'lib/utilities/objects';

import { ProposalNotFoundError } from '../errors';
import type { ProposalWithUsers } from '../interface';
import { isProposalReviewer } from '../isProposalReviewer';

export type ProposalFlowFlags = Record<ProposalStatus, boolean>;

type GetFlagsInput = { userId: string; proposal: ProposalWithUsers };

class TransitionFlags extends BasePermissions<ProposalStatus> {
  constructor() {
    super({ allowedOperations: typedKeys(ProposalStatus) });
  }
}

async function privateDraftProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();
  if (
    isProposalAuthor({ proposal, userId }) ||
    (await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true })).isAdmin
  ) {
    flags.addPermissions(['draft', 'discussion']);
  }
  return flags.operationFlags;
}
async function draftProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();
  if (
    isProposalAuthor({ proposal, userId }) ||
    (await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true })).isAdmin
  ) {
    flags.addPermissions(['private_draft', 'discussion']);
  }
  return flags.operationFlags;
}

async function discussionProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();
  if (
    isProposalAuthor({ proposal, userId }) ||
    (await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true })).isAdmin
  ) {
    flags.addPermissions(['private_draft', 'draft', 'review']);
  }
  return flags.operationFlags;
}

async function inReviewProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();

  const hasReviewerAbility = (
    await Promise.all([
      isProposalReviewer({ proposal, userId }),
      hasSpaceWideProposalReviewerPermission({
        spaceId: proposal.spaceId,
        userId
      })
    ])
  ).some((value) => value === true);

  if (hasReviewerAbility) {
    flags.addPermissions(['reviewed']);
  }
  return flags.operationFlags;
}

async function reviewedProposal({ proposal, userId }: GetFlagsInput): Promise<ProposalFlowFlags> {
  const flags = new TransitionFlags();
  if (
    isProposalAuthor({ proposal, userId }) ||
    (await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true })).isAdmin
  ) {
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
      return privateDraftProposal({ proposal, userId });
    case 'private_draft':
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
