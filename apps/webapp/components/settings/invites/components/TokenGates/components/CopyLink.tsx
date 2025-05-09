import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CopyToClipboard from 'react-copy-to-clipboard';

import { useSnackbar } from 'hooks/useSnackbar';

function CopyLinkButton({ clickable = false }: { clickable?: boolean }) {
  return (
    <Chip
      sx={{ width: 90 }}
      clickable={clickable}
      disabled={!clickable}
      color='secondary'
      size='small'
      variant='outlined'
      label='Copy Link'
    />
  );
}

export function CopyLink({ tokenGatesAvailable, spaceDomain }: { tokenGatesAvailable: boolean; spaceDomain?: string }) {
  const { showMessage } = useSnackbar();
  const shareLink = `${window.location.origin}/join?domain=${spaceDomain}`;

  function onCopy() {
    showMessage('Link copied to clipboard');
  }

  return tokenGatesAvailable ? (
    <CopyToClipboard text={shareLink} onCopy={onCopy}>
      <span>
        <CopyLinkButton clickable />
      </span>
    </CopyToClipboard>
  ) : (
    <Tooltip title='Add a token gate to use this link'>
      <span>
        <CopyLinkButton />
      </span>
    </Tooltip>
  );
}
