import { Box, Switch, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { UseFormSetValue } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';

import type { FormValues } from '../form';

export function EvaluationAppealSettings({
  setValue,
  formValues
}: {
  formValues: FormValues;
  setValue: UseFormSetValue<FormValues>;
}) {
  const { appealable, appealRequiredReviews, finalStep } = formValues;
  return (
    <Stack gap={1}>
      <Box>
        <FieldLabel>Priority Step</FieldLabel>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Typography color='textSecondary' variant='body2'>
            If this Step passes, the entire proposal passes
          </Typography>
          <Switch
            checked={!!finalStep}
            onChange={(e) => {
              const checked = e.target.checked;
              setValue('finalStep', checked);
              setValue('appealRequiredReviews', null);
              setValue('appealable', false);
            }}
          />
        </Stack>
      </Box>
      <Box>
        <FieldLabel>Appeal</FieldLabel>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Typography color='textSecondary' variant='body2'>
            Authors can appeal the decision. The results of the appeal are final.
          </Typography>
          <Switch
            checked={!!appealable}
            onChange={(e) => {
              const checked = e.target.checked;
              setValue('appealRequiredReviews', !checked ? null : 1);
              setValue('finalStep', null);
              setValue('appealable', checked);
            }}
          />
        </Stack>
      </Box>
      {appealable && (
        <Box>
          <FieldLabel>Appeal required reviews</FieldLabel>
          <TextField
            disabled={!appealable}
            type='number'
            onChange={(e) => {
              setValue('appealRequiredReviews', Math.max(1, Number(e.target.value)));
            }}
            fullWidth
            value={appealRequiredReviews ?? ''}
          />
        </Box>
      )}
    </Stack>
  );
}
