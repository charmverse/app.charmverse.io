import { Box } from '@mui/material';

import { RewardTokenDialog } from 'components/rewards/components/RewardProperties/components/RewardTokenDialog';
import { RewardAmount } from 'components/rewards/components/RewardStatusBadge';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTokenDetails, RewardWithUsers } from 'lib/rewards/interfaces';

type Props = {
  onChange: (value: RewardTokenDetails | null) => void;
  currentReward: Pick<
    RewardCreationData & RewardWithUsers,
    'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward' | 'rewardType'
  > | null;
  requireTokenAmount: boolean;
  readOnly: boolean;
  readOnlyToken: boolean;
};

export function RewardTokenProperty({ onChange, currentReward, requireTokenAmount, readOnlyToken, readOnly }: Props) {
  if (!currentReward) {
    return null;
  }

  return (
    <RewardTokenDialog
      requireTokenAmount={requireTokenAmount}
      displayType='details'
      onChange={onChange}
      readOnly={readOnly}
      readOnlyToken={readOnlyToken}
      currentReward={currentReward}
    >
      <Box>
        <RewardAmount
          reward={currentReward}
          truncate={true}
          truncatePrecision={2}
          requireTokenAmount={requireTokenAmount}
          typographyProps={{ variant: 'body2', fontWeight: 'normal', fontSize: 'normal' }}
        />
      </Box>
    </RewardTokenDialog>
  );
}
