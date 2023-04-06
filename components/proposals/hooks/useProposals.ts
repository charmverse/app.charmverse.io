import { useState } from 'react';

import type { ProposalStatusFilter } from 'components/proposals/components/ProposalsViewOptions';
import { usePages } from 'hooks/usePages';
import type { ProposalWithUsers } from 'lib/proposal/interface';

export function useProposals(proposals: ProposalWithUsers[]) {
  const [statusFilter, setStatusFilter] = useState<ProposalStatusFilter>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const { pages } = usePages();

  // filter out deleted and templates
  let filteredProposals = proposals.filter(
    (proposal) => !pages[proposal.id]?.deletedAt && pages[proposal.id]?.type === 'proposal'
  );

  if (statusFilter !== 'all') {
    filteredProposals = filteredProposals.filter((proposal) => proposal.status === statusFilter);
  }

  if (categoryIdFilter !== 'all') {
    filteredProposals = filteredProposals.filter((proposal) => proposal.categoryId === categoryIdFilter);
  }

  filteredProposals = filteredProposals.sort((p1, p2) => {
    const page1 = pages[p1.id];
    const page2 = pages[p2.id];
    if (!page1 || !page2) return 0;
    return page1.createdAt > page2.createdAt ? -1 : 1;
  });

  return {
    filteredProposals,
    statusFilter,
    categoryIdFilter,
    setStatusFilter,
    setCategoryIdFilter
  };
}
