
import Legend from 'components/settings/Legend';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { usePopupState, bindPopover, bindTrigger } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Modal from 'components/common/Modal';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Button from 'components/common/Button';
import { useEffect, useState } from 'react';
import useRoles from 'components/settings/roles/hooks/useRoles';
import ImportDiscordRoles from './components/ImportDiscord/ImportDiscordRolesButton';
import RoleRow from './components/RoleRow';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

export default function RoleSettings () {
  const {
    assignRoles,
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
        <Box component='span' display='flex' gap={1}>
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

      {roles.map(role => <RoleRow assignRoles={assignRoles} unassignRole={unassignRole} deleteRole={deleteRole} role={role} key={role.id} />)}
    </>
  );
}
