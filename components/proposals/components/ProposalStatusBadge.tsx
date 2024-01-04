import styled from '@emotion/styled';
import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';

import type { ProposalEvaluationStatus } from 'lib/proposal/interface';
import type { BrandColor } from 'theme/colors';

export const ProposalStatusColors: Record<ProposalEvaluationStatus, BrandColor> = {
  complete: 'green',
  declined: 'red',
  in_progress: 'yellow',
  passed: 'green',
  published: 'green',
  unpublished: 'gray'
};

const StyledProposalStatusChipNormalText = styled(Chip)<{ status: ProposalEvaluationStatus | null }>`
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return status ? theme.palette[ProposalStatusColors[status]]?.main : theme.palette.gray.main;
  }};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1rem;
  }
  .MuiChip-label {
    font-weight: normal;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

export function ProposalStatusChipTextOnly({
  status,
  size = 'small',
  label
}: {
  size?: ChipProps['size'];
  status: ProposalEvaluationStatus | null;
  label: string;
}) {
  return (
    <StyledProposalStatusChipNormalText
      data-test='proposal-status-badge'
      size={size}
      status={status}
      label={label}
      variant='filled'
    />
  );
}
