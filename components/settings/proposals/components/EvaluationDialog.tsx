import type { ProposalOperation } from '@charmverse/core/prisma';
import { ProposalEvaluationType, ProposalSystemRole } from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Autocomplete,
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { Dialog } from 'components/common/Dialog/Dialog';
import FieldLabel from 'components/common/form/FieldLabel';
import { customLabelEvaluationTypes } from 'lib/proposals/getActionButtonLabels';

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
  actionLabels: yup
    .object({
      approve: yup.string().optional(),
      reject: yup.string().optional()
    })
    .nullable(),
  failReasons: yup.array().of(yup.string().required()).nullable(),
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
  actionLabels
}: {
  type: ProposalEvaluationType;
  actionLabels: WorkflowEvaluationJson['actionLabels'];
  setValue: UseFormSetValue<FormValues>;
}) {
  return customLabelEvaluationTypes.includes(type) ? (
    <Box className='octo-propertyrow'>
      <FieldLabel>Action labels</FieldLabel>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' mb={1}>
        <Box width={150}>
          <PropertyLabel readOnly>Pass</PropertyLabel>
        </Box>
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
        />
      </Stack>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Box width={150}>
          <PropertyLabel readOnly>Decline</PropertyLabel>
        </Box>
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
      </Stack>
    </Box>
  ) : null;
}

function StepFailReasonSelect({
  setValue,
  failReasons
}: {
  failReasons: string[];
  setValue: UseFormSetValue<FormValues>;
}) {
  return (
    <Box className='octo-propertyrow'>
      <FieldLabel>Fail reasons</FieldLabel>
      <Autocomplete<string, true, true, true>
        freeSolo
        value={failReasons}
        getOptionLabel={(option) => option}
        options={failReasons}
        multiple
        disableClearable
        renderInput={(params) => (
          <TextField
            variant='outlined'
            placeholder={failReasons.length === 0 ? 'Create a fail reason option' : ''}
            {...params}
          />
        )}
        onChange={(_, value, reason) => {
          if (reason === 'createOption') {
            setValue('failReasons', value);
          }
        }}
        renderTags={() => {
          return failReasons.map((reason) => (
            <Chip
              sx={{
                mx: 0.25
              }}
              size='small'
              variant='outlined'
              key={reason}
              label={reason}
            />
          ));
        }}
        renderOption={(props, option) => {
          return (
            <MenuItem>
              <Typography
                sx={{
                  width: '100%'
                }}
              >
                {option}
              </Typography>
              <IconButton
                size='small'
                onClick={() => {
                  setValue(
                    'failReasons',
                    failReasons.filter((reason) => reason !== option)
                  );
                }}
              >
                <DeleteIcon color='error' fontSize='small' />
              </IconButton>
            </MenuItem>
          );
        }}
      />
    </Box>
  );
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

  const dialogTitle = evaluation?.id ? 'Edit evaluation' : evaluation ? 'New evaluation step' : '';

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
      actionLabels: evaluation?.actionLabels,
      failReasons: evaluation?.failReasons ?? []
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

  const actionLabels = formValues?.actionLabels as WorkflowEvaluationJson['actionLabels'];
  const failReasons = (formValues?.failReasons as WorkflowEvaluationJson['failReasons']) ?? [];

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
          <>
            <StepActionButtonLabel type={formValues.type} setValue={setValue} actionLabels={actionLabels} />
            {formValues.type === 'pass_fail' && <StepFailReasonSelect failReasons={failReasons} setValue={setValue} />}
          </>
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
            <StepActionButtonLabel type={formValues.type} setValue={setValue} actionLabels={actionLabels} />
            {formValues.type === 'pass_fail' && <StepFailReasonSelect failReasons={failReasons} setValue={setValue} />}
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
