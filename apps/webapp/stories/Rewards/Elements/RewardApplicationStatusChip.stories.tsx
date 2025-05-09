import { Box, Paper } from '@mui/material';

import { RewardApplicationStatusChip } from 'components/rewards/components/RewardApplicationStatusChip';

export default {
  title: 'Rewards/Elements',
  component: RewardApplicationStatusChip
};

export function ApplicationStatus() {
  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' flexDirection='column' gap={1}>
        <Box>
          <h2>Label only</h2>
          <Box display='inline-flex' gap={4}>
            <RewardApplicationStatusChip status='applied' />
            <RewardApplicationStatusChip status='inProgress' />
            <RewardApplicationStatusChip status='review' />
            <RewardApplicationStatusChip status='complete' />
            <RewardApplicationStatusChip status='processing' />
            <RewardApplicationStatusChip status='paid' />
            <span>|</span>
            <RewardApplicationStatusChip status='rejected' />
            <RewardApplicationStatusChip status='cancelled' />
          </Box>
        </Box>
        <Box>
          <h2>With icon</h2>
          <Box display='inline-flex' gap={2}>
            <RewardApplicationStatusChip status='applied' showIcon />
            <RewardApplicationStatusChip status='inProgress' showIcon />
            <RewardApplicationStatusChip status='review' showIcon />
            <RewardApplicationStatusChip status='complete' showIcon />
            <RewardApplicationStatusChip status='processing' showIcon />
            <RewardApplicationStatusChip status='paid' showIcon />
            <span>|</span>
            <RewardApplicationStatusChip status='rejected' showIcon />
            <RewardApplicationStatusChip status='cancelled' showIcon />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
