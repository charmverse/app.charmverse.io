import LinkIcon from '@mui/icons-material/Link';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/router';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useSnackbar } from 'hooks/useSnackbar';
import { getAbsolutePath } from '@packages/lib/utils/browser';

export function CopyPageLinkAction({
  path,
  onComplete,
  message,
  typographyProps,
  isApplication
}: {
  isApplication?: boolean;
  path: string;
  onComplete?: VoidFunction;
  message?: string;
  typographyProps?: Record<string, unknown>;
}) {
  const { showMessage } = useSnackbar();
  const router = useRouter();

  function onClick() {
    showMessage(message || 'Link copied to clipboard');
    onComplete?.();
  }

  return (
    <CopyToClipboard
      text={getAbsolutePath(
        isApplication ? `/rewards/applications${path}` : path,
        router.query.domain as string | undefined
      )}
      onCopy={onClick}
    >
      <MenuItem data-testid='copy-link-page-action' dense>
        <ListItemIcon>
          <LinkIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={typographyProps}>Copy link</ListItemText>
      </MenuItem>
    </CopyToClipboard>
  );
}
