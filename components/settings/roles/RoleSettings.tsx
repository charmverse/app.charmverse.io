
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import ImportDiscordRoles from 'components/settings/roles/components/ImportDiscord/ImportDiscordRolesButton';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';
import * as yup from 'yup';
import RoleForm from './components/RoleForm';
import RoleRow from './components/RoleRow';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

export default function RoleSettings () {
  const {
    assignRoles,
    deleteRole,
    listRoles,
    unassignRole,
    roles
  } = useRoles();

  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });

  useEffect(() => {
    listRoles();
  }, []);

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
        <RoleForm
          mode='create'
          submitted={() => {
            popupState.close();
            listRoles();
          }}
        />

      </Modal>

      {roles.map(role => (
        <RoleRow
          assignRoles={assignRoles}
          unassignRole={unassignRole}
          deleteRole={deleteRole}
          refreshRoles={listRoles}
          role={role}
          key={role.id}
        />
      ))}
    </>
  );
}
