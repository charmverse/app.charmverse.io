import type { Role } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Box, InputLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import type { ISystemError } from '@packages/utils/errors';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import { useMembers } from 'hooks/useMembers';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

export type CreateRoleInput = yup.InferType<typeof schema> & { userIds: string[] };

interface Props {
  onCancel: () => void;
  onSubmit: (value: CreateRoleInput) => Promise<void>;
}

export function CreateRoleForm({ onCancel, onSubmit }: Props) {
  const [formError, setFormError] = useState<ISystemError | null>(null);
  const { guests } = useMembers();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<CreateRoleInput>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  function onChangeNewMembers(ids: string[]) {
    setValue('userIds', ids);
  }

  return (
    <Paper sx={{ p: 2 }}>
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
            <InputLabel>Name</InputLabel>
            <TextField
              {...register('name')}
              autoFocus
              placeholder='Enter a name'
              variant='outlined'
              type='text'
              fullWidth
            />{' '}
          </Box>
          <Box>
            <InputLabel>Members</InputLabel>
            <InputSearchMemberMultiple
              onChange={onChangeNewMembers}
              filter={{
                mode: 'exclude',
                userIds: guests.map((g) => g.id)
              }}
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
