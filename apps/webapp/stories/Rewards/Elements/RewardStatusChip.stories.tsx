import { Box, Paper } from '@mui/material';

import { RewardStatusChip } from 'components/rewards/components/RewardChip';

export default {
  title: 'Rewards/Elements',
  component: RewardStatusChip
};

export function RewardStatus() {
  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' flexDirection='column' gap={1}>
        <Box>
          <h2>Label only</h2>
          <Box display='inline-flex' gap={4}>
            <RewardStatusChip status={undefined} />
            <RewardStatusChip status='open' />
            <RewardStatusChip status='complete' />
            <RewardStatusChip status='paid' />
          </Box>
        </Box>
        <Box>
          <h2>With icon</h2>
          <Box display='inline-flex' gap={4}>
            <RewardStatusChip status='open' />
            <RewardStatusChip status='complete' />
            <RewardStatusChip status='paid' />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
