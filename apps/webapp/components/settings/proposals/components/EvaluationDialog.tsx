import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import { Box, ListItemIcon, ListItemText, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';

import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import FieldLabel from 'components/common/form/FieldLabel';

import { evaluationIcons } from '../constants';

import { EvaluationAdvancedSettingsAccordion } from './EvaluationAdvancedSettings/EvaluationAdvancedSettings';
import { EvaluationPermissions } from './EvaluationPermissions';
import type { EvaluationStepFormValues } from './form';

const StyledListItemText = styled(ListItemText)`
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 0;
  justify-content: space-between;
`;

// This type is used for existing and new workflows (id is null until it is saved)
export type EvaluationTemplateFormItem = Omit<WorkflowEvaluationJson, 'id'> & { id: string | null };

export function EvaluationDialog({
  evaluation,
  isFirstEvaluation,
  onClose,
  onSave
}: {
  evaluation: EvaluationTemplateFormItem | null;
  isFirstEvaluation: boolean;
  onClose: VoidFunction;
  onSave: (evaluation: WorkflowEvaluationJson) => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isValid }
  } = useForm<EvaluationStepFormValues>({});

  const dialogTitle = evaluation?.id ? 'Edit evaluation' : evaluation ? 'New evaluation step' : '';

  const formValues = watch();

  const hideEvaluationAdvancedSettings = evaluation?.type === 'sign_documents' || formValues.type === 'sign_documents';

  function updatePermissions({ permissions }: EvaluationTemplateFormItem) {
    setValue('permissions', permissions);
  }

  useEffect(() => {
    reset({
      id: evaluation?.id || undefined,
      title: evaluation?.title,
      type: evaluation?.type,
      permissions: evaluation?.permissions ?? [],
      actionLabels: evaluation?.actionLabels,
      requiredReviews: evaluation?.requiredReviews ?? 1,
      declineReasons: evaluation?.declineReasons ?? [],
      finalStep: evaluation?.finalStep ?? false,
      appealable: evaluation?.appealable ?? false,
      appealRequiredReviews: evaluation?.appealRequiredReviews,
      showAuthorResultsOnRubricFail: evaluation?.showAuthorResultsOnRubricFail
    });
  }, [evaluation?.id]);

  async function saveForm(values: EvaluationStepFormValues) {
    await onSave({
      ...evaluation,
      ...values,
      id: values.id ?? uuid()
    });
    onClose();
  }

  return (
    <Dialog
      open={!!evaluation}
      onClose={onClose}
      title={dialogTitle}
      footerActions={
        <Stack gap={2} flexDirection='row' alignItems='center'>
          <Button
            sx={{
              alignSelf: 'flex-start'
            }}
            onClick={onClose}
            variant='outlined'
            color='secondary'
          >
            Cancel
          </Button>

          <Button
            disabled={!isValid}
            onClick={handleSubmit(saveForm)}
            sx={{
              alignSelf: 'flex-start'
            }}
          >
            Save
          </Button>
        </Stack>
      }
    >
      <Stack gap={2} width='100%'>
        <div>
          <FieldLabel>Title</FieldLabel>
          <Controller
            name='title'
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange: _onChange, value } }) => (
              <TextField
                placeholder='Community Review'
                autoFocus={!evaluation?.id}
                onChange={_onChange}
                fullWidth
                value={value}
              />
            )}
          />
        </div>
        {evaluation?.id && !hideEvaluationAdvancedSettings && (
          <EvaluationAdvancedSettingsAccordion formValues={formValues} setValue={setValue} />
        )}
        {!evaluation?.id && (
          <>
            <div>
              <FieldLabel>Type</FieldLabel>
              <Controller
                name='type'
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange: _onChange, value } }) => (
                  <Select value={value} onChange={_onChange} fullWidth>
                    <MenuItem value='feedback'>
                      <Box display='flex' alignItems='center' width='100%'>
                        <ListItemIcon>{evaluationIcons.feedback()}</ListItemIcon>
                        <StyledListItemText primary='Feedback' secondary='Request for comments and suggestions' />
                      </Box>
                    </MenuItem>
                    <MenuItem value='pass_fail'>
                      <Box display='flex' alignItems='center' width='100%'>
                        <ListItemIcon>{evaluationIcons.pass_fail()}</ListItemIcon>
                        <StyledListItemText primary='Pass/Decline' secondary='Thumbs up/Thumbs down, binary choice' />
                      </Box>
                    </MenuItem>
                    <MenuItem value='sign_documents'>
                      <Box display='flex' alignItems='center' width='100%'>
                        <ListItemIcon>{evaluationIcons.sign_documents()}</ListItemIcon>
                        <StyledListItemText
                          primary='Sign Documents'
                          secondary='Collect signatures from grant recipients'
                        />
                      </Box>
                    </MenuItem>
                    <MenuItem value='rubric'>
                      <Box display='flex' alignItems='center' width='100%'>
                        <ListItemIcon>{evaluationIcons.rubric()}</ListItemIcon>
                        <StyledListItemText primary='Rubric' secondary='Score against predefined criteria' />
                      </Box>
                    </MenuItem>
                    <MenuItem value='vote'>
                      <Box display='flex' alignItems='center' width='100%'>
                        <ListItemIcon>{evaluationIcons.vote()}</ListItemIcon>
                        <StyledListItemText primary='Vote' secondary='Vote for one or more choices' />
                      </Box>
                    </MenuItem>
                  </Select>
                )}
              />
            </div>

            <FieldLabel>Permissions</FieldLabel>
            <Stack flex={1} className='CardDetail content'>
              {evaluation && (
                <EvaluationPermissions
                  evaluation={formValues}
                  isFirstEvaluation={isFirstEvaluation}
                  onChange={updatePermissions}
                />
              )}
            </Stack>
            {!hideEvaluationAdvancedSettings && (
              <EvaluationAdvancedSettingsAccordion formValues={formValues} setValue={setValue} />
            )}
          </>
        )}
      </Stack>
    </Dialog>
  );
}
