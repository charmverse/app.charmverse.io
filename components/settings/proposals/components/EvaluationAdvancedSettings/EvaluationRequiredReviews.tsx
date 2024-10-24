import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { TextField, Box } from '@mui/material';
import type { UseFormSetValue } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';

import type { EvaluationStepFormValues } from '../form';

export function EvaluationRequiredReviews({
  setValue,
  requiredReviews
}: {
  requiredReviews: WorkflowEvaluationJson['requiredReviews'];
  setValue: UseFormSetValue<EvaluationStepFormValues>;
}) {
  return (
    <Box className='octo-propertyrow'>
      <FieldLabel>Required reviews</FieldLabel>
      <TextField
        type='number'
        onChange={(e) => {
          setValue('requiredReviews', Math.max(1, Number(e.target.value)));
        }}
        fullWidth
        value={requiredReviews}
      />
    </Box>
  );
}
