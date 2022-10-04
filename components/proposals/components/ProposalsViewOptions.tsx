import styled from '@emotion/styled';
import { Chip, InputLabel, MenuItem, Select } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';

import type { ProposalCategory } from 'lib/proposal/interface';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import type { BrandColor } from 'theme/colors';

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

type Props = {
  proposalFilter: ProposalFilter;
  setProposalFilter: (proposalFilter: ProposalFilter) => void;
  proposalSort: ProposalSort;
  setProposalSort: (proposalSort: ProposalSort) => void;
  categoryIdFilter: string | null;
  setCategoryIdFilter: (val: string) => void;
  categories: ProposalCategory[];
}

export default function ProposalsViewOptions ({
  proposalSort,
  setProposalSort,
  proposalFilter,
  setProposalFilter,
  categories,
  categoryIdFilter,
  setCategoryIdFilter

}: Props) {
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

      <Select variant='outlined' value={categoryIdFilter || ''} onChange={(e) => setCategoryIdFilter(e.target.value)}>
        <MenuItem value='all'>All categories</MenuItem>
        {
          categories.map(({ id, title, color }) => <MenuItem key={id} value={id}><Chip sx={{ cursor: 'pointer' }} color={color as BrandColor} label={title} /></MenuItem>)
        }
      </Select>
    </StyledViewOptions>
  );
}
