import { Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import { AddAPropertyButton } from 'components/common/DatabaseEditor/components/properties/AddAProperty';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export function AttachRewardButton({
  createNewReward,
  variant = 'card_property',
  disabled = false
}: {
  disabled?: boolean;
  createNewReward: VoidFunction;
  variant?: 'solid_button' | 'card_property';
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  if (variant === 'card_property') {
    return (
      <AddAPropertyButton disabled={disabled} style={{ marginTop: 0 }} data-test='add-reward' onClick={createNewReward}>
        + Add a {getFeatureTitle('reward')}
      </AddAPropertyButton>
    );
  } else {
    return (
      <Button size='small' data-test='add-reward-from-table' disabled={disabled} onClick={createNewReward}>
        <Typography fontWeight={700} variant='subtitle1'>
          + Add a {getFeatureTitle('reward')}
        </Typography>
      </Button>
    );
  }
}
