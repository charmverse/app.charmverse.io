import type { ApplicationStatus, BountyStatus as RewardStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';

import type { RewardTaskAction } from 'lib/rewards/getRewardTasks';
import type { BrandColor } from 'theme/colors';

export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Complete',
  paid: 'Paid'
};

const REWARD_ACTION_LABELS: Record<RewardTaskAction, string> = {
  application_pending: 'Application pending',
  application_approved: 'Application approved',
  application_rejected: 'Application rejected',
  work_submitted: 'Work submitted',
  work_approved: 'Work approved',
  payment_needed: 'Payment needed',
  payment_complete: 'Payment complete',
  suggested_reward: 'Suggested reward'
};

const REWARD_ACTION_ICONS: Record<RewardTaskAction, ReactNode> = {
  application_pending: <ModeStandbyIcon />,
  application_approved: <CheckCircleOutlineIcon />,
  application_rejected: <ModeStandbyIcon />,
  work_submitted: <CheckCircleOutlineIcon />,
  work_approved: <CheckCircleOutlineIcon />,
  payment_needed: <PaidIcon />,
  payment_complete: <PaidIcon />,
  suggested_reward: <LightbulbIcon />
};

export const REWARD_STATUS_COLORS: Record<RewardStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  inProgress: 'yellow',
  complete: 'blue',
  paid: 'green'
};

export const REWARD_ACTION_COLORS: Record<RewardTaskAction, BrandColor> = {
  application_pending: 'teal',
  application_approved: 'teal',
  application_rejected: 'red',
  work_submitted: 'yellow',
  work_approved: 'yellow',
  payment_needed: 'pink',
  payment_complete: 'gray',
  suggested_reward: 'purple'
};

const isRewardStatus = (status: RewardStatus | RewardTaskAction): status is RewardStatus =>
  status in REWARD_STATUS_LABELS;
const isRewardAction = (status: RewardStatus | RewardTaskAction): status is RewardTaskAction =>
  status in REWARD_ACTION_LABELS;

const StyledRewardStatusChip = styled(Chip)<{ status: RewardStatus | RewardTaskAction }>`
  background-color: ${({ status, theme }) => {
    if (isRewardStatus(status)) {
      return theme.palette[REWARD_STATUS_COLORS[status]].main;
    } else if (isRewardAction(status)) {
      return theme.palette[REWARD_ACTION_COLORS[status]].main;
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
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  inProgress: <AssignmentIndIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

export function RewardStatusChip({
  status,
  size = 'small',
  showIcon = true
}: {
  size?: ChipProps['size'];
  status: RewardStatus;
  showIcon?: boolean;
}) {
  return (
    <StyledRewardStatusChip
      size={size}
      status={status}
      label={REWARD_STATUS_LABELS[status]}
      variant='filled'
      icon={showIcon ? <span>{REWARD_STATUS_ICONS[status]}</span> : undefined}
    />
  );
}
export function RewardStatusNexusChip({
  action,
  size = 'small'
}: {
  size?: ChipProps['size'];
  action: RewardTaskAction;
}) {
  return (
    <StyledRewardStatusChip
      size={size}
      status={action}
      label={REWARD_ACTION_LABELS[action]}
      variant='filled'
      icon={<span>{REWARD_ACTION_ICONS[action]}</span>}
    />
  );
}
