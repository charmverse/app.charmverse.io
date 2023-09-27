import type { ApplicationStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';

import type { BrandColor } from 'theme/colors';

export const REWARD_APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  inProgress: 'In progress',
  paid: 'Paid',
  complete: 'Complete',
  processing: 'Processing payment',
  review: 'Review'
};

export const REWARD_APPLICATION_STATUS_COLORS: Record<ApplicationStatus, BrandColor> = {
  applied: 'teal',
  cancelled: 'gray',
  rejected: 'red',
  inProgress: 'green',
  paid: 'gray',
  complete: 'green',
  processing: 'yellow',
  review: 'yellow'
};

const StyledRewardApplicationStatusChip = styled(Chip)<{ status: ApplicationStatus }>`
  background-color: ${({ status, theme }) => theme.palette[REWARD_APPLICATION_STATUS_COLORS[status]].main};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1.2rem;
  }
  .MuiChip-label {
    font-weight: 600;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;
export function RewardApplicationStatusChip({
  status,
  size = 'small'
}: {
  size?: ChipProps['size'];
  status: ApplicationStatus;
}) {
  return (
    <StyledRewardApplicationStatusChip
      size={size}
      status={status}
      label={REWARD_APPLICATION_STATUS_LABELS[status]}
      variant='filled'
    />
  );
}
