import type { ComponentProps } from 'react';
import { Chip } from '@mui/material';
import type { VoteStatus } from '@prisma/client';

const VoteStatusConfig: Record<VoteStatus | 'Draft', { label: string; color: ComponentProps<typeof Chip>['color']; }> = {
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
  }
};

export default function VoteStatusChip ({ status, ...props }: { status: VoteStatus | 'Draft'; } & ComponentProps<typeof Chip>) {
  return (
    <Chip {...props} color={VoteStatusConfig[status].color} label={VoteStatusConfig[status].label} />
  );
}
