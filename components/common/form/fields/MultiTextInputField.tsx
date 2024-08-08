import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, IconButton, Stack, TextField } from '@mui/material';
import type { FieldValues, Control, FieldArrayPath, Path } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

import { FieldWrapper } from './FieldWrapper';

export function MultiTextInputField<T extends FieldValues>({
  control,
  label,
  name,
  placeholder,
  disabled
}: {
  disabled?: boolean;
  control: Control<T>;
  name: keyof T;
  label: string;
  placeholder: string;
}) {
  const typedName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: typedName
  });

  return (
    <Stack>
      <FieldWrapper label={label}>
        <Stack direction='row' gap={1} alignItems='center' mb={1}>
          <Controller
            control={control}
            name={`${typedName}.0` as Path<T>}
            render={({ field: _field, fieldState }) => (
              <TextField
                disabled={disabled}
                fullWidth
                placeholder={placeholder}
                error={!!fieldState.error}
                {..._field}
              />
            )}
          />
        </Stack>
        {fields.slice(1).map((field, index) => (
          <Stack key={field.id} gap={1} mb={1} direction='row'>
            <Controller
              control={control}
              name={`${typedName}.${index + 1}` as Path<T>}
              render={({ field: _field, fieldState }) => (
                <Stack width='100%' gap={1} alignItems='center' flexDirection='row'>
                  <TextField
                    disabled={disabled}
                    fullWidth
                    placeholder={placeholder}
                    error={!!fieldState.error}
                    {..._field}
                  />
                  <IconButton disabled={disabled} size='small' onClick={() => remove(index + 1)}>
                    <DeleteIcon fontSize='small' color='error' />
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
        disabled={disabled}
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
