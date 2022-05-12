
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import useIsAdmin from 'hooks/useIsAdmin';
import { useRef, useState } from 'react';
import { Menu } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RoleRow from './components/RoleRow';
import RoleForm from './components/RoleForm';
import ImportDiscordRolesMenuItem from './components/ImportDiscordRolesMenuItem';

export default function RoleSettings () {
  const {
    assignRoles,
    deleteRole,
    refreshRoles,
    unassignRole,
    roles
  } = useRoles();
  const isAdmin = useIsAdmin();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Roles
        {isAdmin && (
          <Box component='span' display='flex' gap={1}>
            <Button
              ref={buttonRef}
              variant='outlined'
              endIcon={(
                <KeyboardArrowDownIcon onClick={() => {
                  setAnchorEl(buttonRef?.current);
                }}
                />
              )}
            >
              Import roles
            </Button>
            <Button {...bindTrigger(popupState)}>Add a role</Button>
          </Box>
        )}
      </Legend>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <ImportDiscordRolesMenuItem />
        <ImportGuildRolesMenuItem />
      </Menu>
      <Modal {...bindPopover(popupState)} title='Add a role'>
        <RoleForm
          mode='create'
          submitted={() => {
            popupState.close();
            refreshRoles();
          }}
        />
      </Modal>

      {roles?.map(role => (
        <RoleRow
          isEditable={isAdmin}
          assignRoles={assignRoles}
          unassignRole={unassignRole}
          deleteRole={deleteRole}
          refreshRoles={refreshRoles}
          role={role}
          key={role.id}
        />
      ))}
    </>
  );
}
