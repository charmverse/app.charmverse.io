import type { FormField, Proposal } from '@charmverse/core/prisma-client';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { Reward } from 'lib/rewards/interfaces';

type FormFieldsIncludeType = {
  form: {
    formFields: FormField[] | null;
  } | null;
};

export function mapDbProposalToProposal(
  proposal: Proposal & FormFieldsIncludeType & { rewards: Reward[] }
): ProposalWithUsersAndRubric {
  const { rewards, form, ...rest } = proposal;
  const proposalWithUsers = {
    ...rest,
    rewardIds: rewards.map((r) => r.id) || null,
    formFields: form?.formFields || null
  };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}
