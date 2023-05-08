import type { VoteStatus } from '@charmverse/core/prisma';
import { Chip } from '@mui/material';
import type { ComponentProps } from 'react';

const VoteStatusConfig: Record<
  VoteStatus | 'Draft' | 'Complete',
  { label: string; color: ComponentProps<typeof Chip>['color'] }
> = {
  Cancelled: {
    label: 'Cancelled',
    color: 'gray'
  },
  Draft: {
    label: 'Draft',
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
  Complete: {
    label: 'Complete',
    color: 'purple'
  }
};

export default function VoteStatusChip({
  status,
  ...props
}: { status: VoteStatus | 'Draft' | 'Complete' } & ComponentProps<typeof Chip>) {
  return <Chip {...props} color={VoteStatusConfig[status].color} label={VoteStatusConfig[status].label} />;
}
