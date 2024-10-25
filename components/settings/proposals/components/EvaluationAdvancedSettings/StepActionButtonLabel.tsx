import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { TextField, Box } from '@mui/material';
import { customLabelEvaluationTypes } from '@root/lib/proposals/getActionButtonLabels';
import type { UseFormSetValue } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';

import type { EvaluationStepFormValues } from '../form';

export function StepActionButtonLabel({
  type,
  setValue,
  actionLabels
}: {
  type: ProposalEvaluationType;
  actionLabels: WorkflowEvaluationJson['actionLabels'];
  setValue: UseFormSetValue<EvaluationStepFormValues>;
}) {
  return customLabelEvaluationTypes.includes(type) ? (
    <Box className='octo-propertyrow'>
      <FieldLabel>Decision Labels</FieldLabel>
      <TextField
        placeholder='Pass'
        onChange={(e) => {
          setValue('actionLabels', {
            ...actionLabels,
            approve: e.target.value
          });
        }}
        fullWidth
        value={actionLabels?.approve}
        sx={{
          mb: 1
        }}
      />
      <TextField
        placeholder='Decline'
        onChange={(e) => {
          setValue('actionLabels', {
            ...actionLabels,
            reject: e.target.value
          });
        }}
        fullWidth
        value={actionLabels?.reject}
      />
    </Box>
  ) : null;
}
