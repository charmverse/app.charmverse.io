import { ComponentProps } from 'react';
import { Chip } from '@mui/material';
import { ProposalStatus, VoteStatus } from '@prisma/client';
import { proposalStatusLabels } from 'lib/proposals/interfaces';

const VoteStatusConfig: Record<VoteStatus | ProposalStatus, { label: string, color: ComponentProps<typeof Chip>['color'] }> = {
  // Vote keys
  Cancelled: {
    label: 'Cancelled',
    color: 'gray'
  },
  InProgress: {
    label: 'In progress',
    color: 'teal'
  },
  Passed: {
    label: 'Passed',
    color: 'success'
  },
  Rejected: {
    label: 'Rejected',
    color: 'error'
  },
  // Proposal keys
  draft: {
    label: proposalStatusLabels.draft,
    color: 'gray'
  },
  cancelled: {
    label: proposalStatusLabels.cancelled,
    color: 'gray'
  },
  complete: {
    label: proposalStatusLabels.complete,
    color: 'success'
  },
  in_progress: {
    label: proposalStatusLabels.in_progress,
    color: 'teal'
  }
};

export default function VoteStatusChip ({ status, ...props }: { status: VoteStatus | ProposalStatus } & ComponentProps<typeof Chip>) {
  return (
    <Chip {...props} color={VoteStatusConfig[status].color} label={VoteStatusConfig[status].label} />
  );
}
