import { Box, FormLabel, Stack, Typography } from '@mui/material';

import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import type { EvaluationStepSettingsProps } from './EvaluationStepSettings';

export function ReviewStepSettings({
  rewardInput,
  readOnly,
  onChange
}: Omit<EvaluationStepSettingsProps, 'evaluation' | 'rewardStatus'>) {
  function handleOnChangeReviewers(reviewers: SelectOption[]) {
    onChange({
      reviewers: reviewers as UpdateableRewardFields['reviewers']
    });
  }

  return (
    <Stack gap={1.5}>
      <FormLabel required>
        <Typography component='span' variant='subtitle1'>
          Reviewers
        </Typography>
      </FormLabel>
      <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
        <UserAndRoleSelect
          data-test='reward-reviewer-select'
          emptyPlaceholderContent='Select user or role'
          value={(rewardInput?.reviewers ?? []) as SelectOption[]}
          readOnly={readOnly}
          variant='outlined'
          onChange={handleOnChangeReviewers}
          required
        />
      </Box>
    </Stack>
  );
}
