import { ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { EditOutlined, ArrowDropDown, RateReviewOutlined, VisibilityOutlined } from '@mui/icons-material';
import Button from 'components/common/Button';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { usePrimaryCharmEditor } from 'hooks/usePrimaryCharmEditor';
import type { EditMode } from 'hooks/usePrimaryCharmEditor';

const EDIT_MODE_CONFIG = {
  editing: {
    color: 'primary',
    permission: 'edit_content',
    icon: <EditOutlined fontSize='small' />,
    label: 'Editing'
  },
  suggesting: {
    color: 'success',
    permission: 'comment',
    icon: <RateReviewOutlined fontSize='small' />,
    label: 'Suggesting'
  },
  viewing: {
    color: 'secondary',
    permission: 'read',
    icon: <VisibilityOutlined fontSize='small' />,
    label: 'Viewing'
  }
} as const;

export default function EditModeToggle () {

  const { permissions, editMode, setPageProps } = usePrimaryCharmEditor();

  function setMode (mode: EditMode) {
    setPageProps({ editMode: mode });
  }

  if (!editMode) {
    return null;
  }

  const availableModes = Object.entries(EDIT_MODE_CONFIG).filter(([, config]) => {
    return permissions?.[config.permission] ?? false;
  });

  return (
    <PopupState variant='popover' popupId='edit-mode-select'>
      {(popupState) => (
        <>
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

          <Menu
            {...bindMenu(popupState)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            {availableModes.map(([mode, { icon, label }]) => (
              <MenuItem
                key={mode}
                dense
                onClick={() => {
                  setMode(mode as EditMode);
                  popupState.close();
                }}
              >
                <ListItemIcon sx={{ color: editMode === mode ? `${EDIT_MODE_CONFIG[mode].color}.main` : '' }}>
                  {icon}
                </ListItemIcon>
                <ListItemText>
                  {label}
                </ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </PopupState>
  );
}
