import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { TextField, Typography, IconButton, Box } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';

import type { EvaluationStepFormValues } from '../form';

export function StepFailReasonSelect({
  setValue,
  declineReasons
}: {
  declineReasons: string[];
  setValue: UseFormSetValue<EvaluationStepFormValues>;
}) {
  const [declineReason, setDeclineReason] = useState('');
  const isDuplicate = declineReasons.includes(declineReason);

  function addDeclineReason() {
    setValue('declineReasons', [...declineReasons, declineReason.trim()]);
    setDeclineReason('');
  }

  return (
    <Box className='octo-propertyrow'>
      <FieldLabel>Decline reasons</FieldLabel>
      <Stack direction='row' gap={1} mb={1.5} alignItems='center'>
        <TextField
          value={declineReason}
          placeholder='Add a decline reason'
          variant='outlined'
          sx={{ flexGrow: 1 }}
          onChange={(e) => {
            setDeclineReason(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addDeclineReason();
            }
          }}
        />
        <Button
          variant='outlined'
          disabledTooltip={isDuplicate ? 'This decline reason already exists' : ''}
          disabled={isDuplicate || declineReason.length === 0}
          onClick={addDeclineReason}
        >
          Add
        </Button>
      </Stack>
      <Stack gap={0.5}>
        {declineReasons.length === 0 && (
          <Typography variant='body2' color='textSecondary'>
            No decline reasons added
          </Typography>
        )}
        {declineReasons.map((reason) => (
          <Stack key={reason} direction='row' gap={1} justifyContent='space-between' alignItems='center'>
            <Typography variant='body2'>{reason}</Typography>
            <IconButton
              size='small'
              onClick={() => {
                setValue(
                  'declineReasons',
                  declineReasons.filter((_reason) => reason !== _reason)
                );
              }}
            >
              <DeleteIcon color='error' fontSize='small' />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
