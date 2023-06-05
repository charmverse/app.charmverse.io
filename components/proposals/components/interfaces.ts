import type { ProposalReviewerInput } from '@charmverse/core';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type ProposalFormInputs = {
  title: string;
  content: PageContent | null;
  contentText?: string;
  id?: string;
  categoryId: string | null;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  proposalTemplateId: string | null;
};
