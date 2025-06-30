import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionSummary, Typography, AccordionDetails, Box } from '@mui/material';
import { Stack } from '@mui/system';
import type { WorkflowEvaluationJson } from '@packages/core/proposals';
import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import type { EvaluationStepFormValues } from '../form';

import { EvaluationAppealSettings } from './EvaluationAppealSettings';
import { EvaluationRequiredReviews } from './EvaluationRequiredReviews';
import { ShowRubricResults } from './ShowRubricResults';
import { StepActionButtonLabel } from './StepActionButtonLabel';
import { StepFailReasonSelect } from './StepFailReasonSelect';

export function EvaluationAdvancedSettingsAccordion({
  formValues,
  setValue
}: {
  formValues: EvaluationStepFormValues;
  setValue: UseFormSetValue<EvaluationStepFormValues>;
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
            {formValues.type === 'rubric' && <ShowRubricResults formValues={formValues} setValue={setValue} />}
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
