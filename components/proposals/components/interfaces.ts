import type { ProposalReviewerInput } from '@charmverse/core';

export type ProposalFormInputs = {
  title: string;
  content: any | null;
  contentText?: string;
  id?: string;
  categoryId: string | null;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  proposalTemplateId: string | null;
};
