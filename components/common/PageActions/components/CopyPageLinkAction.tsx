import LinkIcon from '@mui/icons-material/Link';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useSnackbar } from 'hooks/useSnackbar';

export function CopyPageLinkAction({ path, closeMenu }: { path: string; closeMenu?: VoidFunction }) {
  const { showMessage } = useSnackbar();

  function onClick() {
    closeMenu?.();
    showMessage('Link copied to clipboard');
  }

  return (
    <CopyToClipboard text={path} onCopy={onClick}>
      <MenuItem dense>
        <ListItemIcon>
          <LinkIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Copy link</ListItemText>
      </MenuItem>
    </CopyToClipboard>
  );
}
