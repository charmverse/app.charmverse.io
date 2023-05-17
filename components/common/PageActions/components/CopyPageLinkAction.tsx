import LinkIcon from '@mui/icons-material/Link';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/router';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { getAbsolutePath } from 'components/common/Link';
import { useSnackbar } from 'hooks/useSnackbar';

export function CopyPageLinkAction({ path, onComplete }: { path: string; onComplete?: VoidFunction }) {
  const { showMessage } = useSnackbar();
  const router = useRouter();

  function onClick() {
    showMessage('Link copied to clipboard');
    onComplete?.();
  }

  return (
    <CopyToClipboard text={getAbsolutePath(path, router.query.domain as string | undefined)} onCopy={onClick}>
      <MenuItem dense>
        <ListItemIcon>
          <LinkIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Copy link</ListItemText>
      </MenuItem>
    </CopyToClipboard>
  );
}
