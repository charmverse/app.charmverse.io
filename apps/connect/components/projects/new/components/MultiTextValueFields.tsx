import type { FormValues } from '@connect/lib/projects/form';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, FormLabel, IconButton, Stack, TextField } from '@mui/material';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

export function MultiTextValueFields({
  control,
  label,
  name,
  placeholder
}: {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  placeholder: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as FieldArrayPath<FormValues>
  });

  return (
    <Stack>
      <FormLabel id={`project-${name.toLowerCase().replaceAll(' ', '')}`}>{label}</FormLabel>
      <Stack direction='row' gap={1} alignItems='center' mb={1}>
        <Controller
          control={control}
          name={`${name}.0` as FieldArrayPath<FormValues>}
          render={({ field: _field, fieldState }) => (
            <TextField
              fullWidth
              aria-labelledby={`project-${name}-0`}
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
            name={`${name}.${index + 1}` as FieldArrayPath<FormValues>}
            render={({ field: _field, fieldState }) => (
              <Stack width='100%' gap={1} alignItems='center' flexDirection='row'>
                <TextField
                  fullWidth
                  aria-labelledby={`project-${name}-${index + 1}`}
                  placeholder={placeholder}
                  error={!!fieldState.error}
                  {..._field}
                />
                <IconButton size='small'>
                  <DeleteIcon fontSize='small' color='error' onClick={() => remove(index + 1)} />
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
