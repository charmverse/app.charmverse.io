import { Box } from '@mui/material';

import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTokenDetails, RewardWithUsers } from 'lib/rewards/interfaces';

import { RewardAmount } from '../../RewardStatusBadge';

import { RewardTokenDialog } from './RewardTokenDialog';

type Props = {
  onChange: (value: RewardTokenDetails | null) => void;
  currentReward: (RewardCreationData & RewardWithUsers) | null;
  readOnly?: boolean;
};

export function RewardTokenProperty({ onChange, currentReward, readOnly }: Props) {
  if (!currentReward) {
    return null;
  }

  return (
    <RewardTokenDialog displayType='details' onChange={onChange} readOnly={readOnly} currentReward={currentReward}>
      <Box>
        <RewardAmount
          reward={{
            chainId: currentReward.chainId,
            customReward: currentReward.customReward,
            rewardAmount: currentReward.rewardAmount,
            rewardToken: currentReward.rewardToken
          }}
          truncate={true}
          truncatePrecision={2}
          typographyProps={{ variant: 'body2', fontWeight: 'normal', fontSize: 'normal' }}
        />
      </Box>
    </RewardTokenDialog>
  );
}
