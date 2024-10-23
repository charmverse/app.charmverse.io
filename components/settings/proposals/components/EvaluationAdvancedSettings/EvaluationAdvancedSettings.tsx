import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionSummary, Typography, AccordionDetails, Box } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import type { FormValues } from '../form';

import { EvaluationAppealSettings } from './EvaluationAppealSettings';
import { EvaluationRequiredReviews } from './EvaluationRequiredReviews';

export function EvaluationAdvancedSettingsAccordion({
  formValues,
  setValue
}: {
  formValues: FormValues;
  setValue: UseFormSetValue<FormValues>;
}) {
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const actionLabels = formValues?.actionLabels as WorkflowEvaluationJson['actionLabels'];
  const declineReasons = (formValues?.declineReasons as WorkflowEvaluationJson['declineReasons']) ?? [];
  return (
    <Box>
      <Accordion
        style={{ marginBottom: '20px' }}
        expanded={isAdvancedSettingsOpen}
        onChange={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Advanced settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack gap={2}>
            <StepActionButtonLabel type={formValues.type} setValue={setValue} actionLabels={actionLabels} />
            {formValues.type === 'pass_fail' && (
              <>
                <EvaluationRequiredReviews requiredReviews={formValues.requiredReviews} setValue={setValue} />
                <StepFailReasonSelect declineReasons={declineReasons} setValue={setValue} />
                <EvaluationAppealSettings formValues={formValues} setValue={setValue} />
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
