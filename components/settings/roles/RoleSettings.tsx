
import Legend from 'components/settings/Legend';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { usePopupState, bindPopover, bindTrigger } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Modal from 'components/common/Modal';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { getDisplayName } from 'lib/users';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { ListSpaceRolesResponse } from 'charmClient';
import ImportDiscordRoles from './ImportDiscord/ImportDiscordRolesButton';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

export default function RoleAssignment () {
  const {
    assignRole,
    createRole,
    deleteRole,
    listRoles,
    unassignRole,
    roles
  } = useRoles();

  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });

  useEffect(() => {
    listRoles();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Roles
        <Box display='flex' gap={1}>
          <ImportDiscordRoles onUpdate={listRoles} />
          <Button {...bindTrigger(popupState)}>Add a role</Button>
        </Box>
      </Legend>

      <Modal {...bindPopover(popupState)} title='Add a role'>
        <form
          onSubmit={handleSubmit(formValue => {
            createRole(formValue);
            popupState.close();
          })}
          style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}
        >
          <Grid container direction='column' spacing={3}>
            <Grid item>
              <InputLabel>
                Role name
              </InputLabel>
              <TextField
                {...register('name')}
                autoFocus
                placeholder='Bounty manager'
                variant='outlined'
                type='text'
                fullWidth
              />
              {
                errors?.name && (
                  <Alert severity='error'>
                    {errors.name.message}
                  </Alert>
                )
              }
            </Grid>
            <Grid item>
              <Button disabled={!isValid} type='submit'>Create role</Button>
            </Grid>
          </Grid>

        </form>
      </Modal>
      {roles.map(role => <Role role={role} key={role.id} />)}
    </>
  );
}

function Role ({ role }: { role: ListSpaceRolesResponse }) {
  return (
    <Box mb={3}>
      <Typography variant='h6'>
        {role.name}
      </Typography>
      <Divider />
      {role.spaceRolesToRole.length === 0 && (<Typography>No users</Typography>)}
    </Box>
  );
}
