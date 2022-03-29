
import Legend from 'components/settings/Legend';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { usePopupState, bindPopover, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Modal from 'components/common/Modal';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Button from 'components/common/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { getDisplayName } from 'lib/users';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { ListSpaceRolesResponse } from 'charmClient';
import ImportDiscordRoles from './ImportDiscord/ImportDiscordRolesButton';

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

interface RoleRowProps {
  role: ListSpaceRolesResponse
  assignRoles: (roleId: string, userIds: string[]) => void;
  deleteRole: (roleId: string) => void;
  unassignRole: (roleId: string, userId: string) => void;
}

function RoleRow ({ role, assignRoles, unassignRole, deleteRole }: RoleRowProps) {

  const menuState = usePopupState({ variant: 'popover', popupId: `role-${role.id}` });
  const userPopupState = usePopupState({ variant: 'popover', popupId: `role-${role.id}-users` });
  const [newMembers, setNewMembers] = useState<string[]>([]);

  function showMembersPopup () {
    setNewMembers([]);
    userPopupState.open();
  }

  function onChangeNewMembers (ids: string[]) {
    setNewMembers(ids);
  }

  async function addMembers () {
    await assignRoles(role.id, newMembers);
    userPopupState.close();
  }

  return (
    <Box mb={3}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6'>
          {role.name}
        </Typography>
        <IconButton size='small' {...bindTrigger(menuState)}>
          <MoreHorizIcon />
        </IconButton>
      </Box>
      <Divider />
      <Button onClick={showMembersPopup} variant='text' color='secondary'>+ Add members</Button>

      <Menu
        {...bindMenu(menuState)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            deleteRole(role.id);
            menuState.close();
          }}
        >
          <ListItemIcon><DeleteIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
      </Menu>
      <Modal open={userPopupState.isOpen} onClose={userPopupState.close} title='Add members'>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InputSearchContributorMultiple onChange={onChangeNewMembers} />
          </Grid>
          <Grid item>
            <Button onClick={addMembers}>Add</Button>
          </Grid>
        </Grid>
      </Modal>
    </Box>
  );
}
