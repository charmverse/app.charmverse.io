import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import { ListItemButton, ListItemText, Tooltip } from '@mui/material';

export function ExportMarkdownAction({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "This page can't be exported" : ''}>
      <div>
        <ListItemButton disabled={disabled} onClick={onClick}>
          <GetAppOutlinedIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary='Export to markdown' />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
