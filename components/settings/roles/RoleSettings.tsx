
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import ImportDiscordRolesButton from 'components/settings/roles/components/ImportDiscordRolesButton';
import ImportGuildRolesButton from 'components/settings/roles/components/ImportGuildRolesButton';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import useIsAdmin from 'hooks/useIsAdmin';
import { MouseEvent, EventHandler, useState } from 'react';
import { Menu, MenuItem, SvgIcon } from '@mui/material';
import DiscordIcon from 'public/images/discord_logo.svg';
import darkLogoImage from 'public/images/guild-logo-dark-short.png';
import lightLogoImage from 'public/images/guild-logo-light-short.png';
import Image from 'next/image';
import { useTheme } from '@emotion/react';
import RoleRow from './components/RoleRow';
import RoleForm from './components/RoleForm';

export default function RoleSettings () {
  const {
    assignRoles,
    deleteRole,
    refreshRoles,
    unassignRole,
    roles
  } = useRoles();
  const theme = useTheme();
  const logoImage = theme.palette.mode === 'dark' ? lightLogoImage : darkLogoImage;
  const isAdmin = useIsAdmin();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  const [rolesImportSource, setRolesImportSource] = useState<'discord' | 'guild.xyz'>('discord');
  const [anchorEl, setAnchorEl] = useState<SVGSVGElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpen = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Roles
        {isAdmin && (
          <Box component='span' display='flex' gap={1}>
            {rolesImportSource === 'discord' ? (
              <ImportDiscordRolesButton onDownArrowClicked={handleOpen} />
            ) : <ImportGuildRolesButton onDownArrowClicked={handleOpen} />}
            <Button {...bindTrigger(popupState)}>Add a role</Button>
          </Box>
        )}
      </Legend>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          disableRipple
          onClick={() => {
            setRolesImportSource('discord');
            handleClose();
          }}
        >
          <SvgIcon viewBox='0 -10 70 70' sx={{ mr: 1 }}>
            <DiscordIcon />
          </SvgIcon>
          Discord
        </MenuItem>
        <MenuItem
          disableRipple
          onClick={() => {
            setRolesImportSource('guild.xyz');
            handleClose();
          }}
        >
          <div style={{
            marginRight: theme.spacing(1),
            width: 20
          }}
          >
            <Image src={logoImage} alt='Guild.xyz' />
          </div>
          Guild.xyz
        </MenuItem>
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
