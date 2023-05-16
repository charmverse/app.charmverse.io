import UndoIcon from '@mui/icons-material/Undo';
import { ListItemIcon, MenuItem, ListItemText, Tooltip } from '@mui/material';

export function UndoAction({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
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
