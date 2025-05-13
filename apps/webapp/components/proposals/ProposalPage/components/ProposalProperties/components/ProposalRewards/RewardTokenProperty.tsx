import { RewardAmount } from 'components/rewards/components/RewardAmount';
import { RewardTokenDialog } from 'components/rewards/components/RewardProperties/components/RewardTokenDialog';
import type { RewardCreationData } from '@packages/lib/rewards/createReward';
import type { RewardTokenDetails, RewardWithUsers } from '@packages/lib/rewards/interfaces';

type Props = {
  onChange: (value: RewardTokenDetails | null) => void;
  currentReward: Pick<
    RewardCreationData & RewardWithUsers,
    'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward' | 'rewardType'
  > | null;
  requireTokenAmount: boolean;
  readOnlyToken: boolean;
  readOnlyTokenAmount: boolean;
};

export function RewardTokenProperty({
  onChange,
  readOnlyTokenAmount,
  currentReward,
  requireTokenAmount,
  readOnlyToken
}: Props) {
  if (!currentReward) {
    return null;
  }

  const readOnly = readOnlyToken && readOnlyTokenAmount;

  return (
    <RewardTokenDialog
      requireTokenAmount={requireTokenAmount}
      displayType='details'
      onChange={onChange}
      readOnly={readOnly}
      readOnlyToken={readOnlyToken}
      currentReward={currentReward}
      readOnlyTokenAmount={readOnlyTokenAmount}
    >
      <RewardAmount
        reward={currentReward}
        requireTokenAmount={requireTokenAmount}
        noAmountText='Submitter defines amount'
      />
    </RewardTokenDialog>
  );
}
