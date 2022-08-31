import styled from '@emotion/styled';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import DoDisturbIcon from '@mui/icons-material/DoDisturb';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ModeIcon from '@mui/icons-material/Mode';
import ReviewsIcon from '@mui/icons-material/Reviews';
import SecurityIcon from '@mui/icons-material/Security';
import { Chip, ChipProps } from '@mui/material';
import { ProposalStatus } from '@prisma/client';
import { ReactNode } from 'react';
import { BrandColor } from 'theme/colors';

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  private_draft: 'Private draft',
  draft: 'Draft',
  discussion: 'Discussion',
  review: 'In review',
  reviewed: 'Reviewed',
  vote_active: 'Active vote',
  vote_closed: 'Closed vote'
};

const PROPOSAL_STATUS_ICONS : Record<ProposalStatus, ReactNode> = {
  private_draft: <SecurityIcon />,
  draft: <ModeIcon />,
  discussion: <ContactSupportIcon />,
  review: <ReviewsIcon />,
  reviewed: <CheckBoxIcon />,
  vote_active: <HowToVoteIcon />,
  vote_closed: <DoDisturbIcon />
};

export const ProposalStatusColors: Record<ProposalStatus, BrandColor> = {
  private_draft: 'purple',
  draft: 'teal',
  discussion: 'yellow',
  review: 'pink',
  reviewed: 'gray',
  vote_active: 'turquoise',
  vote_closed: 'orange'
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
    font-size: 1.2rem;
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
