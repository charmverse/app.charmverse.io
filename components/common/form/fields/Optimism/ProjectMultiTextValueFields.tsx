import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, IconButton, Stack, TextField } from '@mui/material';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

import { FieldWrapper } from '../FieldWrapper';

import type { OptimismProjectFormValues } from './optimismProjectFormValues';

export function ProjectMultiTextValueFields({
  control,
  label,
  name,
  placeholder
}: {
  control: Control<OptimismProjectFormValues>;
  name: keyof OptimismProjectFormValues;
  label: string;
  placeholder: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as FieldArrayPath<OptimismProjectFormValues>
  });

  return (
    <Stack>
      <FieldWrapper label={label}>
        <Stack direction='row' gap={1} alignItems='center' mb={1}>
          <Controller
            control={control}
            name={`${name}.0` as FieldArrayPath<OptimismProjectFormValues>}
            render={({ field: _field, fieldState }) => (
              <TextField fullWidth placeholder={placeholder} error={!!fieldState.error} {..._field} />
            )}
          />
        </Stack>
        {fields.slice(1).map((field, index) => (
          <Stack key={field.id} gap={1} mb={1} direction='row'>
            <Controller
              control={control}
              name={`${name}.${index + 1}` as FieldArrayPath<OptimismProjectFormValues>}
              render={({ field: _field, fieldState }) => (
                <Stack width='100%' gap={1} alignItems='center' flexDirection='row'>
                  <TextField fullWidth placeholder={placeholder} error={!!fieldState.error} {..._field} />
                  <IconButton size='small'>
                    <DeleteIcon fontSize='small' color='error' onClick={() => remove(index + 1)} />
                  </IconButton>
                </Stack>
              )}
            />
          </Stack>
        ))}
      </FieldWrapper>
      <Button
        sx={{
          width: 'fit-content'
        }}
        startIcon={<AddIcon fontSize='small' />}
        size='small'
        variant='outlined'
        color='secondary'
        onClick={() => {
          append('' as any);
        }}
      >
        Add
      </Button>
    </Stack>
  );
}
