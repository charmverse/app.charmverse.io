import styled from '@emotion/styled';
import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';

import { PROPOSAL_STATUS_LABELS, proposalStatusColors } from 'lib/focalboard/proposalDbProperties';
import type { ProposalEvaluationStatus } from 'lib/proposal/interface';

const StyledProposalStatusChip = styled(Chip)<{ status: ProposalEvaluationStatus }>`
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return theme.palette[proposalStatusColors[status]]?.main;
  }};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1rem;
  }
  .MuiChip-label {
    font-weight: 600;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

export function ProposalStatusChip({
  status,
  size = 'small'
}: {
  size?: ChipProps['size'];
  status: ProposalEvaluationStatus;
}) {
  return (
    <StyledProposalStatusChip
      data-test='proposal-status-badge'
      size={size}
      status={status}
      label={PROPOSAL_STATUS_LABELS[status]}
      variant='filled'
    />
  );
}
