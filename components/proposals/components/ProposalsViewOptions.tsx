import styled from '@emotion/styled';
import { InputLabel, MenuItem, Select } from '@mui/material';
import { ProposalStatus } from '@prisma/client';
import { usePages } from 'hooks/usePages';
import { ProposalWithUsers } from 'lib/proposal/interface';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { useEffect, useState } from 'react';

const StyledViewOptions = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  .MuiInputLabel-root, .MuiSelect-select {
    font-size: .85em;
  }
`;

type ProposalSort = 'latest_created'
type ProposalFilter = ProposalStatus | 'all'

export default function ProposalsViewOptions ({
  proposals,
  setProposals
}: {
  proposals: ProposalWithUsers[],
  setProposals: (proposalWithUsers: ProposalWithUsers[]) => void
}) {
  const [proposalSort, setProposalSort] = useState<ProposalSort>('latest_created');
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('all');
  const { pages } = usePages();

  useEffect(() => {
    if (proposalSort === 'latest_created') {
      setProposals(proposals.sort((p1, p2) => {
        const page1 = pages[p1.id];
        const page2 = pages[p2.id];

        return (page1?.createdAt ?? 0) > (page2?.createdAt ?? 0) ? -1 : 1;
      }));
    }
  }, [proposalSort]);

  useEffect(() => {
    if (proposalFilter === 'all') {
      setProposals(proposals);
    }
    else {
      setProposals(proposals.filter(proposal => proposal.status === proposalFilter));
    }
  }, [proposalFilter]);

  return (
    <StyledViewOptions>
      <InputLabel>Sort</InputLabel>
      <Select variant='outlined' value={proposalSort} onChange={(e) => setProposalSort(e.target.value as ProposalSort)} sx={{ mr: 2 }}>
        <MenuItem value='latest_created'>Created</MenuItem>
      </Select>
      <InputLabel>Filter</InputLabel>
      <Select variant='outlined' value={proposalFilter} onChange={(e) => setProposalFilter(e.target.value as ProposalFilter)}>
        {
          Object.entries(PROPOSAL_STATUS_LABELS)
            .map(([proposalStatus, proposalStatusLabel]) => <MenuItem key={proposalStatus} value={proposalStatus}>{proposalStatusLabel}</MenuItem>)
        }
        <MenuItem value='all'>All</MenuItem>
      </Select>
    </StyledViewOptions>
  );
}
