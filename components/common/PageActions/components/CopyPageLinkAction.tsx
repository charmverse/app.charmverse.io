import LinkIcon from '@mui/icons-material/Link';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/router';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useSnackbar } from 'hooks/useSnackbar';
import { getAbsolutePath } from 'lib/utils/browser';

export function CopyPageLinkAction({
  path,
  onComplete,
  message
}: {
  path: string;
  onComplete?: VoidFunction;
  message?: string;
}) {
  const { showMessage } = useSnackbar();
  const router = useRouter();

  function onClick() {
    showMessage(message || 'Link copied to clipboard');
    onComplete?.();
  }

  return (
    <CopyToClipboard text={getAbsolutePath(path, router.query.domain as string | undefined)} onCopy={onClick}>
      <MenuItem data-testid='copy-link-page-action' dense>
        <ListItemIcon>
          <LinkIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Copy link</ListItemText>
      </MenuItem>
    </CopyToClipboard>
  );
}
