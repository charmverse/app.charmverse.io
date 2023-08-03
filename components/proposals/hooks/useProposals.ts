import { useCallback, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { ProposalStatusFilter } from 'components/proposals/components/ProposalViewOptions/ProposalsViewOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';

export function useProposals() {
  const [statusFilter, setStatusFilter] = useState<ProposalStatusFilter>('all');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const { pages } = usePages();
  const { space } = useCurrentSpace();
  const {
    data: proposals,
    mutate: mutateProposals,
    isLoading
  } = useSWR(space ? `proposals/${space.id}` : null, () =>
    charmClient.proposals.getProposalsBySpace({ spaceId: space!.id })
  );

  // filter out deleted and templates
  let filteredProposals = proposals?.filter(
    (proposal) => !pages[proposal.id]?.deletedAt && pages[proposal.id]?.type === 'proposal'
  );
  if (statusFilter === 'archived') {
    filteredProposals = filteredProposals?.filter((p) => !!p.archived);
    // Never show archived proposals within the other statuses list
  } else if (statusFilter === 'all') {
    filteredProposals = filteredProposals?.filter((p) => !p.archived);
  } else if (statusFilter) {
    filteredProposals = filteredProposals?.filter((proposal) => proposal.status === statusFilter && !proposal.archived);
  }
  if (categoryIdFilter !== 'all') {
    filteredProposals = filteredProposals?.filter((proposal) => proposal.categoryId === categoryIdFilter);
  }

  filteredProposals = filteredProposals?.sort((p1, p2) => {
    const page1 = pages[p1.id];
    const page2 = pages[p2.id];
    if (!page1 || !page2) return 0;
    return page1.createdAt > page2.createdAt ? -1 : 1;
  });

  const archiveProposal = useCallback(
    async (input: ArchiveProposalRequest) => {
      if (space) {
        const proposal = await charmClient.proposals.archiveProposal(input);
        mutateProposals((oldProposals) => {
          const proposalList = oldProposals ?? [];
          const existingProposalIndex = proposalList.findIndex((p) => p.id === proposal.id);
          if (existingProposalIndex < 0) {
            proposalList.push(proposal);
          } else {
            proposalList[existingProposalIndex] = proposal;
          }
          return proposalList;
        });
      }
    },
    [mutateProposals, space]
  );

  return {
    proposals,
    filteredProposals,
    statusFilter,
    categoryIdFilter,
    setStatusFilter,
    setCategoryIdFilter,
    mutateProposals,
    isLoading,
    archiveProposal
  };
}
