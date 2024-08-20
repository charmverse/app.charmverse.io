import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Box, IconButton, Stack, TextField, Button, FormLabel } from '@mui/material';
import type { FieldValues, Control, FieldArrayPath, Path } from 'react-hook-form';
import { Controller, useController, useFieldArray } from 'react-hook-form';

export function MultiTextInputField<T extends FieldValues>({
  control,
  label,
  name,
  placeholder,
  disabled,
  required,
  'data-test': dataTest
}: {
  control: Control<T>;
  name: keyof T;
  label: string;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  ['data-test']?: string;
}) {
  const typedName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: typedName
  });
  const { field: arrayField } = useController({ name: typedName as Path<T>, control });

  return (
    <Stack>
      <FormLabel required={required} id={`project-${typedName.toLowerCase().replaceAll(' ', '')}`}>
        {label}
      </FormLabel>
      <Stack direction='row' gap={1} alignItems='center' mb={1}>
        <Controller
          control={control}
          name={`${typedName}.0` as Path<T>}
          render={({ field: _field, fieldState }) => {
            return (
              <TextField
                aria-labelledby={`project-${typedName}-0`}
                disabled={disabled}
                data-test={dataTest}
                fullWidth
                placeholder={placeholder}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                {..._field}
                value={arrayField.value[0]}
                onChange={(e) => {
                  arrayField.onChange({
                    target: {
                      value: [e.target.value, ...arrayField.value.slice(1)]
                    }
                  });
                }}
              />
            );
          }}
        />
      </Stack>
      {fields.slice(1).map((field, index) => (
        <Stack key={field.id} gap={1} mb={1} direction='row'>
          <Controller
            control={control}
            name={`${typedName}.${index + 1}` as Path<T>}
            render={({ field: _field, fieldState }) => (
              <Stack width='100%' gap={1} alignItems='flex-start' flexDirection='row'>
                <TextField
                  aria-labelledby={`project-${typedName}-${index + 1}`}
                  disabled={disabled}
                  fullWidth
                  placeholder={placeholder}
                  error={!!fieldState.error}
                  {..._field}
                  helperText={fieldState.error?.message}
                  value={arrayField.value[index + 1]}
                  onChange={(e) => {
                    arrayField.onChange({
                      target: {
                        value: [
                          ...arrayField.value.slice(0, index + 1),
                          e.target.value,
                          ...arrayField.value.slice(index + 2)
                        ]
                      }
                    });
                  }}
                />
                <Box mt={0.5}>
                  <IconButton disabled={disabled} size='small' onClick={() => remove(index + 1)}>
                    <DeleteIcon fontSize='small' color='error' />
                  </IconButton>
                </Box>
              </Stack>
            )}
          />
        </Stack>
      ))}
      <Button
        sx={{ width: 'fit-content' }}
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
