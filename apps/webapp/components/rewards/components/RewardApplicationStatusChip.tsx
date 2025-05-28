import type { ApplicationStatus } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilledPageIcon from '@mui/icons-material/DescriptionOutlined';
import DoDisturbOutlinedIcon from '@mui/icons-material/DoDisturbOutlined';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import type { SvgIconTypeMap, SxProps } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import Tooltip from '@mui/material/Tooltip';

import type { BrandColor } from 'theme/colors';

export const REWARD_APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  submission_rejected: 'Submission denied',
  cancelled: 'Cancelled',
  inProgress: 'In progress',
  rejected: 'Application denied',
  review: 'Review',
  complete: 'Approved',
  processing: 'Processing payment',
  paid: 'Paid'
};

export const REWARD_APPLICATION_STATUS_COLORS: Record<ApplicationStatus, BrandColor> = {
  applied: 'pink',
  cancelled: 'gray',
  rejected: 'red',
  submission_rejected: 'red',
  inProgress: 'yellow',
  paid: 'green',
  complete: 'blue',
  processing: 'purple',
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
  padding-left: 0.3rem;
  padding-right: 0.3rem;
`;
const REWARD_APPLICATION_STATUS_ICONS: Record<
  ApplicationStatus,
  OverridableComponent<SvgIconTypeMap<object, 'svg'>>
> = {
  applied: ModeStandbyIcon,
  rejected: DoDisturbOutlinedIcon,
  submission_rejected: DoDisturbOutlinedIcon,
  inProgress: AssignmentIndIcon,
  review: FilledPageIcon,
  complete: CheckCircleOutlineIcon,
  processing: AccessTimeOutlinedIcon,
  paid: PaidIcon,
  cancelled: DoDisturbOutlinedIcon
};

export const applicationStatuses = ['applied', 'rejected'];

export function RewardApplicationStatusIcon({
  status,
  showTooltip
}: {
  status: ApplicationStatus;
  showTooltip?: boolean;
}) {
  const Icon = REWARD_APPLICATION_STATUS_ICONS[status];

  if (!Icon) {
    return null;
  }

  return (
    <Tooltip title={showTooltip ? REWARD_APPLICATION_STATUS_LABELS[status] : ''}>
      <Icon
        color='secondary'
        style={{ color: `var(--text-${REWARD_APPLICATION_STATUS_COLORS[status]})`, opacity: 0.8 }}
      />
    </Tooltip>
  );
}

export function RewardApplicationStatusChip({
  status,
  size = 'small',
  showIcon,
  sx
}: {
  sx?: SxProps;
  size?: ChipProps['size'];
  status: ApplicationStatus;
  showIcon?: boolean;
}) {
  return (
    <StyledRewardApplicationStatusChip
      data-test='reward-application-status-chip'
      style={{ justifyContent: 'flex-start' }}
      size={size}
      sx={sx}
      status={status}
      label={REWARD_APPLICATION_STATUS_LABELS[status]}
      variant='filled'
      icon={showIcon ? <RewardApplicationStatusIcon status={status} showTooltip={true} /> : undefined}
    />
  );
}
