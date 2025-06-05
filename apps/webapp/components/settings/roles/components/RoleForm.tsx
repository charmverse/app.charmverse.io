import type { Role } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import type { ISystemError } from '@packages/utils/errors';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { useRoles } from 'hooks/useRoles';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>;

interface Props {
  submitted: (value: Partial<Role>) => void;
  role: Partial<Role>;
}

export function RoleForm({ role, submitted }: Props) {
  const [formError, setFormError] = useState<ISystemError | null>(null);

  const { updateRole } = useRoles();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      name: role?.name
    }
  });

  return (
    <form
      onSubmit={handleSubmit((formValue) => {
        setFormError(null);
        updateRole({
          ...role,
          ...formValue
        })
          .then((updatedRole) => {
            submitted(updatedRole);
          })
          .catch((error) => {
            setFormError(error);
          });
      })}
      style={{ margin: 'auto' }}
    >
      <Grid container direction='column' spacing={3}>
        <Grid>
          <InputLabel>Role name</InputLabel>
          <TextField
            {...register('name')}
            autoFocus
            placeholder='Reward manager'
            variant='outlined'
            type='text'
            fullWidth
          />
          {errors?.name && <Alert severity='error'>{errors.name.message}</Alert>}
        </Grid>

        {formError && (
          <Grid>
            <Alert severity='error'>{formError.message ?? (formError as any).error}</Alert>
          </Grid>
        )}
        <Grid>
          <Button disabled={!isValid} type='submit'>
            Rename role
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
