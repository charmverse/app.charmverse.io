import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { ListItemButton, ListItemText, Tooltip } from '@mui/material';

export function DeletePageAction({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "You don't have permission to delete this page" : ''}>
      <div>
        <ListItemButton data-test='header--delete-current-page' disabled={disabled} onClick={onClick}>
          <DeleteOutlineOutlinedIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary='Delete' />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
