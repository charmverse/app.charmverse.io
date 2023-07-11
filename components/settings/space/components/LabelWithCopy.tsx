import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

type Props = {
  label: string;
  copyText?: string;
};

export function LabelWithCopy({ label, copyText }: Props) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <CopyToClipboard text={label} onCopy={onCopy}>
      <Stack direction='row' gap={0.5} alignItems='center'>
        <Tooltip placement='top' title={copied ? 'Copied' : copyText || 'Click to copy'} disableInteractive arrow>
          <Stack alignItems='center'>
            <ContentCopyIcon fontSize='small' sx={{ cursor: 'pointer' }} />
          </Stack>
        </Tooltip>

        <Typography variant='caption'>{label}</Typography>
      </Stack>
    </CopyToClipboard>
  );
}
