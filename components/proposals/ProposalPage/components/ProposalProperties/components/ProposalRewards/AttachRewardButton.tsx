import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

export function AttachRewardButton({ createNewReward }: { createNewReward: VoidFunction }) {
  const { getFeatureTitle } = useSpaceFeatures();
  return <AddAPropertyButton onClick={createNewReward}>+ Add a {getFeatureTitle('reward')}</AddAPropertyButton>;
}

export function getDisabledTooltip({
  newPageValues,
  rewardValues
}: {
  newPageValues: NewPageValues | null;
  rewardValues: UpdateableRewardFields;
}) {
  let disabledTooltip: string | undefined;
  if (!newPageValues?.title) {
    disabledTooltip = 'Page title is required';
  } else if (!rewardValues.reviewers?.length) {
    disabledTooltip = 'Reviewer is required';
  } else if (
    !rewardValues.customReward &&
    (!rewardValues.rewardToken || !rewardValues.rewardAmount || !rewardValues.chainId)
  ) {
    disabledTooltip = 'Reward is required';
  } else if (rewardValues.assignedSubmitters && rewardValues.assignedSubmitters.length === 0) {
    disabledTooltip = 'You need to assign at least one submitter';
  }

  return disabledTooltip;
}
