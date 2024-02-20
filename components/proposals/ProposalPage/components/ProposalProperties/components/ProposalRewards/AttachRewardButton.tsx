import { Typography } from '@mui/material';

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
      <AddAPropertyButton style={{ marginTop: 0 }} dataTest='add-reward' onClick={createNewReward}>
        + Add a {getFeatureTitle('reward')}
      </AddAPropertyButton>
    );
  } else {
    return (
      <Button size='small' onClick={createNewReward}>
        <Typography fontWeight={700} variant='subtitle1'>
          New
        </Typography>
      </Button>
    );
  }
}

export function getDisabledTooltip({
  readOnly,
  newPageValues,
  rewardValues,
  isProposalTemplate
}: {
  readOnly?: boolean;
  newPageValues: NewPageValues | null;
  rewardValues: UpdateableRewardFields;
  isProposalTemplate: boolean;
}) {
  let disabledTooltip: string | undefined;
  if (readOnly) {
    disabledTooltip = 'You do not have permission to edit';
  } else if (!newPageValues?.title) {
    disabledTooltip = 'Page title is required';
  } else if (!rewardValues.reviewers?.length) {
    disabledTooltip = 'Reviewer is required';
  } else if (rewardValues.assignedSubmitters && rewardValues.assignedSubmitters.length === 0 && !isProposalTemplate) {
    disabledTooltip = 'You need to assign at least one submitter';
  }

  return disabledTooltip;
}
