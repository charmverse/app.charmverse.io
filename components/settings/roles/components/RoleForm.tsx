import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import type { Role } from '@prisma/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import { useRoles } from 'hooks/useRoles';
import type { ISystemError } from 'lib/utilities/errors';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>;

interface Props {
  submitted?: (value: Partial<Role>) => void;
  role?: Partial<Role>;
  mode: 'create' | 'edit';
}

export default function RoleForm({ role = {}, mode = 'create', submitted = () => {} }: Props) {
  const [formError, setFormError] = useState<ISystemError | null>(null);

  const { createRole, updateRole } = useRoles();

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
        if (mode === 'edit') {
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
        } else {
          createRole(formValue)
            .then((newRole) => {
              submitted(newRole);
            })
            .catch((error) => {
              setFormError(error);
            });
        }
      })}
      style={{ margin: 'auto' }}
    >
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <InputLabel>Role name</InputLabel>
          <TextField
            {...register('name')}
            autoFocus
            placeholder='Bounty manager'
            variant='outlined'
            type='text'
            fullWidth
          />
          {errors?.name && <Alert severity='error'>{errors.name.message}</Alert>}
        </Grid>

        {formError && (
          <Grid item>
            <Alert severity='error'>{formError.message ?? (formError as any).error}</Alert>
          </Grid>
        )}
        <Grid item>
          <Button disabled={!isValid} type='submit'>
            {mode === 'edit' ? 'Rename role' : 'Create role'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
