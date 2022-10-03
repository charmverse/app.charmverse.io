import { useState } from 'react';

import type { ProposalFilter, ProposalSort } from 'components/proposals/components/ProposalsViewOptions';
import { usePages } from 'hooks/usePages';
import type { ProposalWithUsers } from 'lib/proposal/interface';

export function useProposalSortAndFilters (proposals: ProposalWithUsers[]) {
  const [proposalSort, setProposalSort] = useState<ProposalSort>('latest_created');
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const { pages } = usePages();

  let filteredProposals = proposals;

  if (proposalFilter !== 'all') {
    filteredProposals = filteredProposals.filter(proposal => proposal.status === proposalFilter);
  }

  if (categoryIdFilter !== 'all') {
    filteredProposals = filteredProposals.filter(proposal => proposal.categoryId === categoryIdFilter);
  }

  filteredProposals = filteredProposals.sort((p1, p2) => {
    const page1 = pages[p1.id];
    const page2 = pages[p2.id];

    return (page1?.createdAt ?? 0) > (page2?.createdAt ?? 0) ? -1 : 1;
  });

  return { filteredProposals, proposalSort, proposalFilter, categoryIdFilter, setProposalFilter, setCategoryIdFilter, setProposalSort };
}
