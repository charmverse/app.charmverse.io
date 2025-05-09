import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';

export function ExportMarkdownAction({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "This page can't be exported" : ''}>
      <div>
        <ListItemButton disabled={disabled} onClick={onClick}>
          <ListItemIcon>
            <GetAppOutlinedIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Export to markdown' />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
