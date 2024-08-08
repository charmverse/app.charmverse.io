import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Stack, TextField, Button, FormLabel } from '@mui/material';
import type { FieldValues, Control, FieldArrayPath, Path } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

export function MultiTextInputField<T extends FieldValues>({
  control,
  label,
  name,
  placeholder,
  disabled,
  'data-test': dataTest
}: {
  disabled?: boolean;
  control: Control<T>;
  name: keyof T;
  label: string;
  placeholder: string;
  ['data-test']?: string;
}) {
  const typedName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: typedName
  });

  return (
    <Stack>
      <FormLabel id={`project-${typedName.toLowerCase().replaceAll(' ', '')}`}>{label}</FormLabel>
      <Stack direction='row' gap={1} alignItems='center' mb={1}>
        <Controller
          control={control}
          name={`${typedName}.0` as Path<T>}
          render={({ field: _field, fieldState }) => (
            <TextField
              aria-labelledby={`project-${typedName}-0`}
              disabled={disabled}
              data-test={dataTest}
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
                  aria-labelledby={`project-${typedName}-${index + 1}`}
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
