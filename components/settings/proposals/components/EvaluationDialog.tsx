import { ProposalEvaluationType } from '@charmverse/core/prisma';
import { Box, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { Dialog } from 'components/common/Dialog/Dialog';
import FieldLabel from 'components/common/form/FieldLabel';
import { permissionLevels, permissionGroups } from 'lib/proposal/workflows/interfaces';
import type {
  WorkflowTemplate,
  EvaluationTemplate,
  SpaceEvaluationPermission
} from 'lib/proposal/workflows/interfaces';

import { EvaluationPermissions } from './EvaluationPermissions';

const evaluationTypes: ProposalEvaluationType[] = Object.keys(ProposalEvaluationType) as ProposalEvaluationType[];

// This type is used for existing and new workflows (id is null until it is saved)
export type EvaluationTemplateFormItem = Omit<EvaluationTemplate, 'id'> & { id: string | null };

export const schema = yup.object({
  id: yup.string().required(),
  title: yup.string().required(),
  type: yup.mixed<ProposalEvaluationType>().oneOf(evaluationTypes).required(),
  permissions: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        level: yup.mixed<SpaceEvaluationPermission['level']>().oneOf(permissionLevels).required(),
        group: yup.mixed<SpaceEvaluationPermission['group']>().oneOf(permissionGroups).required()
      })
    )
    .required()
});

type FormValues = yup.InferType<typeof schema>;

export function EvaluationDialog({
  evaluation,
  onClose,
  onSave
}: {
  evaluation: EvaluationTemplateFormItem | null;
  onClose: VoidFunction;
  onSave: (evaluation: EvaluationTemplate) => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
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
      permissions: evaluation?.permissions ?? []
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
                    <MenuItem value='pass_fail'>Pass/Fail</MenuItem>
                    <MenuItem value='rubric'>Rubric evaluation</MenuItem>
                    <MenuItem value='vote'>Vote</MenuItem>
                  </Select>
                )}
              />
            </div>
            <FieldLabel>Permissions</FieldLabel>
            <Stack flex={1} className='CardDetail content'>
              {evaluation && <EvaluationPermissions evaluation={formValues} onChange={updatePermissions} />}
            </Stack>
          </>
        )}
      </Stack>
    </Dialog>
  );
}
