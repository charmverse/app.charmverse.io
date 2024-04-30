import type { ProposalOperation } from '@charmverse/core/prisma';
import { ProposalEvaluationType, ProposalSystemRole } from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import { Box, ListItemIcon, ListItemText, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import FieldLabel from 'components/common/form/FieldLabel';

import { evaluationIcons } from '../constants';

import { proposalOperations, EvaluationPermissions } from './EvaluationPermissions';

const evaluationTypes: ProposalEvaluationType[] = Object.keys(ProposalEvaluationType) as ProposalEvaluationType[];

const StyledListItemText = styled(ListItemText)`
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 0;
  justify-content: space-between;
`;

// This type is used for existing and new workflows (id is null until it is saved)
export type EvaluationTemplateFormItem = Omit<WorkflowEvaluationJson, 'id'> & { id: string | null };

export const schema = yup.object({
  id: yup.string().required(),
  title: yup.string().required(),
  type: yup.mixed<ProposalEvaluationType>().oneOf(evaluationTypes).required(),
  actionButtonLabels: yup
    .object({
      approve: yup.string().optional(),
      reject: yup.string().optional()
    })
    .nullable(),
  permissions: yup
    .array()
    .of(
      yup.object({
        operation: yup.mixed<ProposalOperation>().oneOf(proposalOperations).required(),
        userId: yup.string().nullable(),
        roleId: yup.string().nullable(),
        systemRole: yup.mixed<ProposalSystemRole>().oneOf(Object.values(ProposalSystemRole)).nullable()
      })
    )
    .required()
});

type FormValues = yup.InferType<typeof schema>;

function StepActionButtonLabel({
  type,
  setValue,
  actionButtonLabels
}: {
  type: ProposalEvaluationType;
  actionButtonLabels: WorkflowEvaluationJson['actionButtonLabels'];
  setValue: UseFormSetValue<FormValues>;
}) {
  return type === 'pass_fail' || type === 'rubric' ? (
    <div>
      <FieldLabel>Action button labels</FieldLabel>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' mb={1}>
        <Typography width='50%'>Pass</Typography>
        <TextField
          placeholder='Pass'
          onChange={(e) => {
            setValue('actionButtonLabels', {
              ...actionButtonLabels,
              approve: e.target.value
            });
          }}
          fullWidth
          value={actionButtonLabels?.approve}
        />
      </Stack>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Typography width='50%'>Decline</Typography>
        <TextField
          placeholder='Decline'
          onChange={(e) => {
            setValue('actionButtonLabels', {
              ...actionButtonLabels,
              reject: e.target.value
            });
          }}
          fullWidth
          value={actionButtonLabels?.reject}
        />
      </Stack>
    </div>
  ) : null;
}

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
  } = useForm<FormValues>({});

  const dialogTitle = evaluation?.id ? 'Rename evaluation' : evaluation ? 'New evaluation step' : '';

  const formValues = watch();

  function updatePermissions({ permissions }: EvaluationTemplateFormItem) {
    setValue('permissions', permissions);
  }

  useEffect(() => {
    reset({
      id: evaluation?.id || undefined,
      title: evaluation?.title,
      type: evaluation?.type,
      permissions: evaluation?.permissions ?? [],
      actionButtonLabels: evaluation?.actionButtonLabels
    });
  }, [evaluation?.id]);

  async function saveForm(values: FormValues) {
    await onSave({
      ...evaluation,
      ...values,
      id: values.id ?? uuid()
    });
    onClose();
  }

  const actionButtonLabels = formValues?.actionButtonLabels as WorkflowEvaluationJson['actionButtonLabels'];

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
        {evaluation?.id && (
          <StepActionButtonLabel type={formValues.type} setValue={setValue} actionButtonLabels={actionButtonLabels} />
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
            <StepActionButtonLabel type={formValues.type} setValue={setValue} actionButtonLabels={actionButtonLabels} />
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
          </>
        )}
      </Stack>
    </Dialog>
  );
}
