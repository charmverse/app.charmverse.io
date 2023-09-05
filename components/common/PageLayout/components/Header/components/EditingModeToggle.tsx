import type { PagePermissionFlags } from '@charmverse/core/permissions';
import { ArrowDropDown } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { IconButton, useMediaQuery, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { memo } from 'react';

import { Button } from 'components/common/Button';
import { useCharmEditor, EDIT_MODE_CONFIG } from 'hooks/useCharmEditor';
import type { EditMode } from 'hooks/useCharmEditor';

function EditModeToggle() {
  const { availableEditModes, permissions, editMode, setPageProps } = useCharmEditor();
  const isLargeScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  function setMode(mode: EditMode) {
    setPageProps({ editMode: mode });
  }

  if (!editMode) {
    return null;
  }

  const availableModes = availableEditModes.map((mode) => {
    return [mode, EDIT_MODE_CONFIG[mode]] as const;
  });

  const _permissions = permissions || ({} as PagePermissionFlags);

  return (
    <PopupState variant='popover' popupId='edit-mode-select'>
      {(popupState) => (
        <>
          {isLargeScreen ? (
            <Tooltip title='Toggle suggestion mode'>
              <Button
                {...bindTrigger(popupState)}
                startIcon={EDIT_MODE_CONFIG[editMode].icon}
                endIcon={<ArrowDropDown />}
                size='small'
                disableElevation
                variant='outlined'
                color={EDIT_MODE_CONFIG[editMode].color}
              >
                {EDIT_MODE_CONFIG[editMode].label}
              </Button>
            </Tooltip>
          ) : (
            <IconButton {...bindTrigger(popupState)}>{EDIT_MODE_CONFIG[editMode].icon}</IconButton>
          )}

          <Menu
            {...bindMenu(popupState)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            {availableModes.map(([mode, { label, color, icon, permission }]) => (
              <MenuItem
                key={mode}
                dense
                onClick={() => {
                  if (_permissions[permission]) {
                    setMode(mode);
                  }
                  popupState.close();
                }}
                disabled={!_permissions[permission]}
              >
                <ListItemIcon sx={{ color: editMode === mode ? `${color}.main` : '' }}>{icon}</ListItemIcon>
                <ListItemText>{label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </PopupState>
  );
}

export default memo(EditModeToggle);
