import styled from '@emotion/styled';
import { InputLabel, MenuItem, Select } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

const StyledViewOptions = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  .MuiInputLabel-root, .MuiSelect-select {
    font-size: .85em;
  }
`;

export type ProposalSort = 'latest_created'
export type ProposalFilter = ProposalStatus | 'all'

export default function ProposalsViewOptions ({
  proposalSort,
  setProposalSort,
  proposalFilter,
  setProposalFilter
}: {
  proposalFilter: ProposalFilter,
  setProposalFilter: (proposalFilter: ProposalFilter) => void
  proposalSort: ProposalSort,
  setProposalSort: (proposalSort: ProposalSort) => void
}) {
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
