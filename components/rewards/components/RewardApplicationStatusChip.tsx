import type { ApplicationStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoDisturbOutlinedIcon from '@mui/icons-material/DoDisturbOutlined';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import RuleIcon from '@mui/icons-material/Rule';
import type { SvgIconTypeMap } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode } from 'react';

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
  inProgress: 'yellow',
  paid: 'green',
  complete: 'blue',
  processing: 'purple',
  review: 'orange'
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
  padding-left: 0.3rem;
  padding-right: 0.3rem;
`;
const REWARD_APPLICATION_STATUS_ICONS: Record<
  ApplicationStatus,
  OverridableComponent<SvgIconTypeMap<object, 'svg'>>
> = {
  applied: ModeStandbyIcon,
  rejected: DoDisturbOutlinedIcon,
  inProgress: AssignmentIndIcon,
  review: RuleIcon,
  complete: CheckCircleOutlineIcon,
  processing: AccessTimeOutlinedIcon,
  paid: PaidIcon,
  cancelled: DoDisturbOutlinedIcon
};

export function RewardApplicationStatusIcon({
  status,
  showTooltip,
  fontSize = 'small'
}: {
  status: ApplicationStatus;
  showTooltip?: boolean;
  fontSize?: 'small' | 'medium';
}) {
  const Icon = REWARD_APPLICATION_STATUS_ICONS[status];

  if (!Icon) {
    return null;
  }

  return (
    <Tooltip title={showTooltip ? REWARD_APPLICATION_STATUS_LABELS[status] : ''}>
      <Icon color='secondary' />
    </Tooltip>
  );
}

export function RewardApplicationStatusChip({
  status,
  size = 'small',
  showIcon
}: {
  size?: ChipProps['size'];
  status: ApplicationStatus;
  showIcon?: boolean;
}) {
  return (
    <StyledRewardApplicationStatusChip
      style={{ justifyContent: 'flex-start' }}
      size={size}
      status={status}
      label={REWARD_APPLICATION_STATUS_LABELS[status]}
      variant='filled'
      icon={showIcon ? <RewardApplicationStatusIcon status={status} showTooltip={true} /> : undefined}
    />
  );
}
