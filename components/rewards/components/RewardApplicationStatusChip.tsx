import type { ApplicationStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoDisturbOutlinedIcon from '@mui/icons-material/DoDisturbOutlined';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
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
  applied: 'gray',
  cancelled: 'gray',
  rejected: 'red',
  inProgress: 'teal',
  paid: 'green',
  complete: 'blue',
  processing: 'yellow',
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
export const rewardApplicationStatusIcons: Record<ApplicationStatus, ReactNode> = {
  applied: <ModeStandbyIcon />,
  rejected: <DoDisturbOutlinedIcon />,
  inProgress: <AssignmentIndIcon />,
  review: <RuleFolderOutlinedIcon />,
  complete: <CheckCircleOutlineIcon />,
  processing: <AccessTimeOutlinedIcon />,
  paid: <PaidIcon />,
  cancelled: <DoDisturbOutlinedIcon />
};
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
      icon={showIcon ? <span>{rewardApplicationStatusIcons[status]}</span> : undefined}
    />
  );
}
