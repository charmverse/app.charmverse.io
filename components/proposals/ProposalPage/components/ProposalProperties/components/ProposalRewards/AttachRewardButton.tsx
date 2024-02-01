import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { Button } from 'components/common/Button';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

export function AttachRewardButton({
  createNewReward,
  variant = 'card_property'
}: {
  createNewReward: VoidFunction;
  variant?: 'solid_button' | 'card_property';
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  if (variant === 'card_property') {
    return (
      <AddAPropertyButton style={{ marginTop: 0 }} onClick={createNewReward}>
        + Add a {getFeatureTitle('reward')}
      </AddAPropertyButton>
    );
  } else {
    return (
      <Button size='small' onClick={createNewReward}>
        + Add a {getFeatureTitle('reward')}
      </Button>
    );
  }
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
  } else if (rewardValues.assignedSubmitters && rewardValues.assignedSubmitters.length === 0) {
    disabledTooltip = 'You need to assign at least one submitter';
  }

  return disabledTooltip;
}
