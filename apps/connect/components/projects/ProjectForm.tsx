import { yupResolver } from '@hookform/resolvers/yup';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, FormLabel, IconButton, Stack, TextField } from '@mui/material';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import type { FormValues } from './utils/form';
import { schema } from './utils/form';

function MultiTextValueFields({
  control,
  label,
  name,
  placeholder
}: {
  control: Control<FormValues>;
  name: FieldArrayPath<FormValues>;
  label: string;
  placeholder: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });

  return (
    <Stack>
      <FormLabel>{label}</FormLabel>
      <Controller
        control={control}
        name={`${name}.0` as FieldArrayPath<FormValues>}
        render={({ field: _field, fieldState }) => (
          <TextField
            fullWidth
            aria-labelledby={`project-${name}-0`}
            placeholder={placeholder}
            error={!!fieldState.error}
            sx={{ mb: 1 }}
            {..._field}
          />
        )}
      />
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
          append('');
        }}
      >
        Add
      </Button>
    </Stack>
  );
}

export function ProjectForm({ onCancel }: { onCancel: VoidFunction }) {
  const {
    control,
    formState: { isValid },
    handleSubmit,
    getValues
  } = useForm({
    defaultValues: {},
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  return (
    <Stack gap={2}>
      <Stack>
        <FormLabel>Name</FormLabel>
        <Controller
          control={control}
          name='name'
          render={({ field, fieldState }) => (
            <TextField placeholder='Acme Inc.' aria-labelledby='project-name' error={!!fieldState.error} {...field} />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel>Description</FormLabel>
        <Controller
          control={control}
          name='description'
          render={({ field }) => (
            <TextField
              multiline
              rows={3}
              aria-labelledby='project-description'
              placeholder='A description of your project'
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel>Project avatar and cover image</FormLabel>
        <TextField multiline rows={3} placeholder='A description of your project' />
      </Stack>
      <MultiTextValueFields control={control} name='website' label='Website' placeholder='https://acme-inc.com' />
      <MultiTextValueFields control={control} name='farcaster' label='Farcaster' placeholder='https://farcaster.xyz' />
      <Stack>
        <FormLabel>X.com</FormLabel>
        <Controller
          control={control}
          name='twitter'
          render={({ field, fieldState }) => (
            <TextField
              placeholder='https://x.com/acme-inc'
              aria-labelledby='project-twitter'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel>Github</FormLabel>
        <Controller
          control={control}
          name='github'
          render={({ field, fieldState }) => (
            <TextField
              placeholder='https://github.com/acme-inc'
              aria-labelledby='project-github'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel>Mirror</FormLabel>
        <Controller
          control={control}
          name='mirror'
          render={({ field, fieldState }) => (
            <TextField
              placeholder='https://mirror.xyz/acme-inc'
              aria-labelledby='project-mirror'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack justifyContent='space-between' flexDirection='row'>
        <Button color='error' variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!isValid}>Next</Button>
      </Stack>
    </Stack>
  );
}
