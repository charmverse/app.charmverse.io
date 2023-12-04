import type { Proposal } from '@charmverse/core/prisma-client';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { Reward } from 'lib/rewards/interfaces';

export function mapDbProposalToProposal(proposal: Proposal & { rewards: Reward[] }): ProposalWithUsersAndRubric {
  const { rewards, ...rest } = proposal;
  const proposalWithUsers = { ...rest, rewardIds: rewards.map((r) => r.id) || null };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}
