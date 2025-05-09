import type {
  Block,
  Bounty,
  BountyPermission,
  Proposal,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalReviewer,
  ProposalRubricCriteria,
  Vote,
  VoteOptions
} from '@charmverse/core/prisma';

export type RelatedPageData = {
  blocks: {
    board?: Omit<Block, 'schema'>;
    views?: Omit<Block, 'schema'>[];
    card?: Omit<Block, 'schema'>;
  };
  votes?: (Vote & { voteOptions: VoteOptions[] })[];
  proposal?:
    | (Omit<Proposal, 'categoryId'> & {
        evaluations: (ProposalEvaluation & {
          reviewers: ProposalReviewer[];
          rubricCriteria: ProposalRubricCriteria[];
          permissions: ProposalEvaluationPermission[];
        })[];
      })
    | null;
  bounty?: (Bounty & { permissions: BountyPermission[] }) | null;
};
