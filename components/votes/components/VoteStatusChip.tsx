import { ComponentProps } from 'react';
import { Chip } from '@mui/material';
import { VoteStatus } from '@prisma/client';

const VoteStatusConfig: Record<VoteStatus, { label: string, color: ComponentProps<typeof Chip>['color'] }> = {
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
  }
};

export default function VoteStatusChip ({ status, ...props }: { status: VoteStatus } & ComponentProps<typeof Chip>) {
  return (
    <Chip {...props} color={VoteStatusConfig[status].color} label={VoteStatusConfig[status].label} />
  );
}
