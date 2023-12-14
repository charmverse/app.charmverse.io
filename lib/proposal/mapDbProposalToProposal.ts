import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { Proposal } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalEvaluation } from '@prisma/client';

import { getOldProposalStatus } from './getOldProposalStatus';
import type { ProposalWithUsersAndRubric } from './interface';

export function mapDbProposalToProposal({
  proposal,
  permissions
}: {
  proposal: Proposal & {
    evaluations: ProposalEvaluation[];
    rewards: { id: string }[];
    reviewers: { evaluationId: string | null }[];
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersAndRubric {
  const { rewards, ...rest } = proposal;
  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.evaluations.length ? getCurrentEvaluation(proposal.evaluations)?.id : undefined,
    status: getOldProposalStatus(proposal),
    // Support old model: filter out evaluation-specific reviewers
    reviewers: proposal.reviewers.filter((reviewer) => !reviewer.evaluationId),
    rewardIds: rewards.map((r) => r.id) || null
  };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}
