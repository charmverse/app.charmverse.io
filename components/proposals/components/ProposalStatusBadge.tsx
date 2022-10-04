import styled from '@emotion/styled';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import ReviewsOutlinedIcon from '@mui/icons-material/ReviewsOutlined';
import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';
import type { ReactNode } from 'react';

import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import type { BrandColor } from 'theme/colors';

const PROPOSAL_STATUS_ICONS : Record<ProposalStatus, ReactNode> = {
  private_draft: <LockOutlinedIcon />,
  draft: <ModeEditOutlineOutlinedIcon />,
  discussion: <ChatOutlinedIcon />,
  review: <ReviewsOutlinedIcon />,
  reviewed: <CheckOutlinedIcon />,
  vote_active: <HowToVoteOutlinedIcon />,
  vote_closed: <BarChartOutlinedIcon />
};

export const ProposalStatusColors: Record<ProposalStatus, BrandColor> = {
  private_draft: 'gray',
  draft: 'gray',
  discussion: 'teal',
  review: 'yellow',
  reviewed: 'purple',
  vote_active: 'pink',
  vote_closed: 'red'
};

const StyledProposalStatusChip = styled(Chip)<{ status: ProposalStatus }>`
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return theme.palette[ProposalStatusColors[status]].main;
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

export function ProposalStatusChip ({
  status,
  size = 'small'
}: { size?: ChipProps['size'], status: ProposalStatus }) {
  return (
    <StyledProposalStatusChip
      size={size}
      status={status}
      label={PROPOSAL_STATUS_LABELS[status]}
      variant='filled'
      icon={<span>{PROPOSAL_STATUS_ICONS[status]}</span>}
    />
  );
}
