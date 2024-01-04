import styled from '@emotion/styled';
import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';

import { evaluationIcons } from 'components/settings/proposals/constants';
import type { ProposalEvaluationStep } from 'lib/proposal/interface';

const StyledProposalStepChipNormalText = styled(Chip)<{ bold?: boolean }>`
  background-color: ${({ theme }) => {
    return theme.palette.gray.main;
  }};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1rem;
  }
  .MuiChip-label {
    font-weight: ${({ bold }) => (bold ? '600' : 'normal')};
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

export function ProposalStatusChip({
  label,
  size = 'small',
  step
}: {
  label: string;
  size?: ChipProps['size'];
  step: ProposalEvaluationStep;
}) {
  return (
    <StyledProposalStepChipNormalText
      data-test='proposal-step-badge'
      size={size}
      bold
      label={label}
      variant='filled'
      icon={<span>{evaluationIcons[step]()}</span>}
    />
  );
}

export function ProposalStepChipTextOnly({ label, size = 'small' }: { size?: ChipProps['size']; label: string }) {
  return (
    <StyledProposalStepChipNormalText data-test='proposal-step-badge' size={size} label={label} variant='filled' />
  );
}
