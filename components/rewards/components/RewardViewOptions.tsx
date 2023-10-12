import { BountyStatus as RewardStatus } from '@charmverse/core/prisma';
import { objectUtils } from '@charmverse/core/utilities';
import { Box, MenuItem, Select } from '@mui/material';

import { ViewOptions } from 'components/common/ViewOptions';

import { RewardStatusChip } from './RewardChip';

export type RewardStatusFilter = RewardStatus | 'all';

const rewardStatuses = objectUtils.typedKeys(RewardStatus);

type Props = {
  rewardStatusFilter: RewardStatusFilter;
  setRewardStatusFilter: (statusFilter: RewardStatusFilter) => void;
};

export function RewardsViewOptions({
  rewardStatusFilter,
  setRewardStatusFilter,
  // Needed for the playwright selector to get the correct item (since we use this component twice)
  testKey = ''
}: Props & { testKey?: string }) {
  return (
    <ViewOptions label='Filter'>
      <Box data-test={`proposal-view-options-${testKey}`} display='flex' gap={1}>
        <Select
          sx={{ height: '32px' }}
          data-test='proposal-category-list'
          variant='outlined'
          value={rewardStatusFilter || ''}
          renderValue={(value) => {
            if (value === 'all') {
              return 'All statuses';
            }

            return <RewardStatusChip status={value} />;
          }}
          onChange={(e) => {
            if (e.target.value) {
              setRewardStatusFilter(e.target.value as RewardStatusFilter);
            }
          }}
        >
          <MenuItem value='all'>All statuses</MenuItem>
          {rewardStatuses.map((status) => (
            <MenuItem
              data-test={`reward-status-${status}`}
              key={status}
              value={status}
              sx={{ justifyContent: 'space-between' }}
            >
              <RewardStatusChip size='small' status={status} />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </ViewOptions>
  );
}
