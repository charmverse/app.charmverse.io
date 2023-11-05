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

import type { BountyNotificationType } from 'lib/notifications/interfaces';
import type { BrandColor } from 'theme/colors';

export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Approved',
  paid: 'Paid'
};

const REWARD_ACTION_LABELS: Record<BountyNotificationType, string> = {
  'application.created': 'Application pending',
  'application.approved': 'Application approved',
  'application.rejected': 'Application rejected',
  'submission.created': 'Work submitted',
  'submission.approved': 'Work approved',
  'application.payment_pending': 'Payment needed',
  'application.payment_completed': 'Payment complete',
  'suggestion.created': 'Suggested reward'
};

const REWARD_ACTION_ICONS: Record<BountyNotificationType, ReactNode> = {
  'application.created': <ModeStandbyIcon />,
  'application.approved': <CheckCircleOutlineIcon />,
  'application.rejected': <ModeStandbyIcon />,
  'submission.created': <CheckCircleOutlineIcon />,
  'submission.approved': <CheckCircleOutlineIcon />,
  'application.payment_pending': <PaidIcon />,
  'application.payment_completed': <PaidIcon />,
  'suggestion.created': <LightbulbIcon />
};

export const REWARD_STATUS_COLORS: Record<RewardStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  inProgress: 'yellow',
  complete: 'blue',
  paid: 'green'
};

export const REWARD_ACTION_COLORS: Record<BountyNotificationType, BrandColor> = {
  'application.created': 'teal',
  'application.approved': 'teal',
  'application.rejected': 'red',
  'submission.created': 'yellow',
  'submission.approved': 'yellow',
  'application.payment_pending': 'pink',
  'application.payment_completed': 'gray',
  'suggestion.created': 'purple'
};

const isRewardStatus = (status: RewardStatus | BountyNotificationType): status is RewardStatus =>
  status in REWARD_STATUS_LABELS;
const isRewardAction = (status: RewardStatus | BountyNotificationType): status is BountyNotificationType =>
  status in REWARD_ACTION_LABELS;

const StyledRewardStatusChip = styled(Chip)<{ status: RewardStatus | BountyNotificationType }>`
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
  action: BountyNotificationType;
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
