import type { BountyStatus as RewardStatus } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';

import type { BrandColor } from 'theme/colors';

const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  draft: 'Draft',
  suggestion: 'Suggestion',
  open: 'Open',
  complete: 'Approved',
  paid: 'Paid'
};

const REWARD_STATUS_COLORS: Record<RewardStatus, BrandColor> = {
  draft: 'gray',
  suggestion: 'purple',
  open: 'teal',
  complete: 'blue',
  paid: 'green'
};

const isRewardStatus = (status: RewardStatus): status is RewardStatus => status in REWARD_STATUS_COLORS;

const StyledStatusChip = styled(Chip)`
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

const StyledRewardStatusChip = styled(StyledStatusChip)<{ status?: RewardStatus }>`
  background-color: ${({ status, theme }) => {
    if (status && isRewardStatus(status)) {
      return theme.palette[REWARD_STATUS_COLORS[status]].main;
    } else {
      return 'initial';
    }
  }};
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

export const REWARD_STATUS_ICONS: Record<RewardStatus, ReactNode> = {
  draft: <LightbulbIcon />,
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

export function RewardStatusChip({
  status,
  size = 'small',
  showIcon = true,
  showEmptyStatus = false
}: {
  size?: ChipProps['size'];
  status?: RewardStatus;
  showIcon?: boolean;
  showEmptyStatus?: boolean;
}) {
  if (!status && !showEmptyStatus) {
    return null;
  }
  return (
    <StyledRewardStatusChip
      size={size}
      status={status}
      label={REWARD_STATUS_LABELS[status || 'open']}
      variant={status ? 'filled' : 'outlined'}
      icon={showIcon ? <span>{REWARD_STATUS_ICONS[status || 'open']}</span> : undefined}
    />
  );
}
