import UndoIcon from '@mui/icons-material/Undo';
import type { SxProps, Theme } from '@mui/material';
import { ListItemIcon, ListItemText, MenuItem, Tooltip } from '@mui/material';

export function UndoAction({
  disabled = false,
  onClick,
  listItemStyle = {}
}: {
  disabled?: boolean;
  onClick: VoidFunction;
  listItemStyle?: SxProps<Theme>;
}) {
  return (
    <Tooltip title={disabled ? "You don't have permission to undo changes" : ''}>
      <div>
        <MenuItem disabled={disabled} onClick={onClick}>
          <ListItemIcon>
            <UndoIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Undo' />
        </MenuItem>
      </div>
    </Tooltip>
  );
}
