import type { ProposalOperation } from '@charmverse/core/prisma';
import { ProposalEvaluationType, ProposalSystemRole } from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import { ExpandMore } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
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
  requiredReviews: yup.number().optional(),
  declineReasons: yup.array().of(yup.string().required()).nullable(),
  finalStep: yup.boolean().optional(),
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
  declineReasons
}: {
  declineReasons: string[];
  setValue: UseFormSetValue<FormValues>;
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

function StepRequiredReviews({
  setValue,
  requiredReviews
}: {
  requiredReviews: WorkflowEvaluationJson['requiredReviews'];
  setValue: UseFormSetValue<FormValues>;
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

function EvaluationFinalStepToggle({
  setValue,
  finalStep,
  isLastEvaluation
}: {
  isLastEvaluation: boolean;
  finalStep: WorkflowEvaluationJson['finalStep'];
  setValue: UseFormSetValue<FormValues>;
}) {
  return (
    <Box>
      <FieldLabel>Final step</FieldLabel>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Typography color='textSecondary' variant='body2'>
          If this step passes, the entire workflow passes
        </Typography>
        <Switch
          checked={isLastEvaluation ? true : finalStep}
          disabled={isLastEvaluation}
          onChange={(e) => setValue('finalStep', e.target.checked)}
        />
      </Stack>
    </Box>
  );
}

export function EvaluationDialog({
  evaluation,
  isFirstEvaluation,
  isLastEvaluation,
  onClose,
  onSave
}: {
  evaluation: EvaluationTemplateFormItem | null;
  isFirstEvaluation: boolean;
  isLastEvaluation: boolean;
  onClose: VoidFunction;
  onSave: (evaluation: WorkflowEvaluationJson) => void;
}) {
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
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
      requiredReviews: evaluation?.requiredReviews ?? 1,
      declineReasons: evaluation?.declineReasons ?? [],
      finalStep: evaluation?.finalStep ?? false
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
  const declineReasons = (formValues?.declineReasons as WorkflowEvaluationJson['declineReasons']) ?? [];

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
          <Accordion
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
                    <EvaluationFinalStepToggle
                      isLastEvaluation={isLastEvaluation || !evaluation?.id}
                      finalStep={formValues.finalStep}
                      setValue={setValue}
                    />
                    <StepRequiredReviews requiredReviews={formValues.requiredReviews} setValue={setValue} />
                    <StepFailReasonSelect declineReasons={declineReasons} setValue={setValue} />
                  </>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
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
            <Accordion
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
                      <EvaluationFinalStepToggle
                        isLastEvaluation={isLastEvaluation || !evaluation?.id}
                        finalStep={formValues.finalStep}
                        setValue={setValue}
                      />
                      <StepRequiredReviews requiredReviews={formValues.requiredReviews} setValue={setValue} />
                      <StepFailReasonSelect declineReasons={declineReasons} setValue={setValue} />
                    </>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Stack>
    </Dialog>
  );
}
