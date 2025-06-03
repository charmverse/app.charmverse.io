import type { Bounty as Reward } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { RewardAmount } from 'components/rewards/components/RewardAmount';
import { RewardStatusChip } from 'components/rewards/components/RewardChip';

type Props = {
  reward: Partial<Pick<Reward, 'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward' | 'status'>>;
};

export function KanbanRewardStatus({ reward }: Props) {
  return (
    <Grid container direction='column' alignItems='center'>
      <Grid size='grow' width='100%' display='flex' flexDirection='column' sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
            justifyContent: 'space-between',
            gap: 1,
            alignItems: 'center',
            minHeight: '30px'
          }}
        >
          <RewardAmount
            reward={reward}
            typographyProps={{
              fontWeight: '600',
              variant: 'h6',
              fontSize: 18
            }}
            truncatePrecision={4}
          />
          <RewardStatusChip status={reward.status} />
        </Box>
      </Grid>
    </Grid>
  );
}
