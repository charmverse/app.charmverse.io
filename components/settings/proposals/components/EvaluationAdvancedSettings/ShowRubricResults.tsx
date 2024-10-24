import { Box, Stack, Switch, Typography } from '@mui/material';
import type { UseFormSetValue } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';

import type { EvaluationStepFormValues } from '../form';

export function ShowRubricResults({
  setValue,
  formValues
}: {
  formValues: EvaluationStepFormValues;
  setValue: UseFormSetValue<EvaluationStepFormValues>;
}) {
  return (
    <Box className='octo-propertyrow'>
      <FieldLabel>Show Author Results on Rubric Fail</FieldLabel>
      <Box display='flex' alignItems='center'>
        <Switch
          checked={!!formValues.showAuthorResultsOnRubricFail}
          onChange={(ev) => setValue('showAuthorResultsOnRubricFail', ev.target.checked)}
        />
        <Typography variant='body2' color='textSecondary'>
          If enabled, authors can see their evaluation results when the evaluation fails
        </Typography>
      </Box>
    </Box>
  );
}
