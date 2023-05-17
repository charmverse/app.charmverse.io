import LinkIcon from '@mui/icons-material/Link';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/router';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useSnackbar } from 'hooks/useSnackbar';

export function CopyPageLinkAction({ path, onComplete }: { path: string; onComplete?: VoidFunction }) {
  const { showMessage } = useSnackbar();
  const router = useRouter();

  function onClick() {
    showMessage('Link copied to clipboard');
    onComplete?.();
  }

  return (
    <CopyToClipboard text={getAbsolutePath(router.query.domain as string | undefined, path)} onCopy={onClick}>
      <MenuItem dense>
        <ListItemIcon>
          <LinkIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Copy link</ListItemText>
      </MenuItem>
    </CopyToClipboard>
  );
}

function getAbsolutePath(subdomain: string | undefined, path: string) {
  const absolutePath = subdomain ? `/${subdomain}${path}` : path;
  if (typeof window !== 'undefined') {
    return window.location.origin + absolutePath;
  }
  return absolutePath;
}
