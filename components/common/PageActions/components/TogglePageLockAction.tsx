import LockIcon from '@mui/icons-material/Lock';
import UnlockIcon from '@mui/icons-material/LockOpen';
import { ListItemButton, ListItemText, Tooltip } from '@mui/material';

export function TogglePageLockAction({
  disabled = false,
  onClick,
  isLocked
}: {
  disabled?: boolean;
  onClick: VoidFunction;
  isLocked: boolean;
}) {
  const title = isLocked ? 'Unlock' : 'Lock';
  const Icon = isLocked ? UnlockIcon : LockIcon;

  return (
    <Tooltip title={disabled ? 'You cannot edit the lock for this page' : ''}>
      <div>
        <ListItemButton data-test='header--toggle-current-page-lock' disabled={disabled} onClick={onClick}>
          <Icon
            color='secondary'
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary={title} />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
