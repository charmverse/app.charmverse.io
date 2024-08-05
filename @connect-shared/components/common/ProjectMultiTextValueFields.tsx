import type { FormValues } from '@connect-shared/lib/projects/form';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, FormLabel, IconButton, Stack, TextField } from '@mui/material';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

export function ProjectMultiTextValueFields<T extends Partial<FormValues> = FormValues>({
  control,
  label,
  name,
  placeholder,
  dataTest,
  required
}: {
  control: Control<any>;
  name: keyof T;
  label: string;
  placeholder: string;
  dataTest?: string;
  required?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as FieldArrayPath<FormValues>
  });

  return (
    <Stack>
      <FormLabel required={required} id={`project-${(name as string).toLowerCase().replaceAll(' ', '')}`}>
        {label}
      </FormLabel>
      <Stack direction='row' gap={1} alignItems='center' mb={1}>
        <Controller
          control={control}
          name={`${name as string}.0` as FieldArrayPath<FormValues>}
          render={({ field: _field, fieldState }) => (
            <TextField
              fullWidth
              data-test={dataTest}
              aria-labelledby={`project-${name as string}-0`}
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
            name={`${name as string}.${index + 1}` as FieldArrayPath<FormValues>}
            render={({ field: _field, fieldState }) => (
              <Stack width='100%' gap={1} alignItems='center' flexDirection='row'>
                <TextField
                  fullWidth
                  aria-labelledby={`project-${name as string}-${index + 1}`}
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
