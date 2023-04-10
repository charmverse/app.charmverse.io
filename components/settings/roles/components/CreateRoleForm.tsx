import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Box, Card, InputLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import type { Role } from '@prisma/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import type { ISystemError } from 'lib/utilities/errors';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>;

interface Props {
  onCancel: () => void;
  onSubmit: (value: Partial<Role>) => Promise<void>;
}

export function CreateRoleForm({ onCancel, onSubmit }: Props) {
  const [formError, setFormError] = useState<ISystemError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box mb={2}>
        <Typography variant='body2' fontWeight='bold' color='secondary'>
          Create a new role
        </Typography>
      </Box>
      <form
        onSubmit={handleSubmit((formValue) => {
          setFormError(null);
          onSubmit(formValue).catch((error) => {
            setFormError(error);
          });
        })}
        style={{ margin: 'auto' }}
      >
        <Stack spacing={3}>
          <Box>
            <InputLabel>Role name</InputLabel>
            <TextField
              {...register('name')}
              autoFocus
              placeholder='Enter a name'
              variant='outlined'
              type='text'
              fullWidth
            />
            {errors?.name && <Alert severity='error'>{errors.name.message}</Alert>}
          </Box>

          {formError && <Alert severity='error'>{formError.message ?? (formError as any).error}</Alert>}
          <Box display='flex' justifyContent='space-between'>
            <Button disabled={!isValid} type='submit'>
              Create role
            </Button>
            <Button color='secondary' variant='outlined' onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}
