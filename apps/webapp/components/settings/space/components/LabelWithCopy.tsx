import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Stack, Tooltip, Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material/Typography';
import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

type Props = {
  label: string;
  copyText?: string;
  iconPosition?: 'left' | 'right';
};

export function LabelWithCopy({ label, copyText, iconPosition = 'left', ...restProps }: Props & TypographyProps) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <CopyToClipboard text={label} onCopy={onCopy}>
      <Stack direction='row' gap={0.5} alignItems='center'>
        {iconPosition === 'left' && <TooltipIcon copied={copied} copyText={copyText} />}
        <Typography variant='caption' {...restProps}>
          {label}
        </Typography>
        {iconPosition === 'right' && <TooltipIcon copied={copied} copyText={copyText} />}
      </Stack>
    </CopyToClipboard>
  );
}

export function TooltipIcon({ copied, copyText }: { copied: boolean; copyText?: string }) {
  const title = copied ? 'Copied' : copyText || 'Click to copy';

  return (
    <Tooltip placement='top' title={title} enterDelay={0} leaveDelay={0} disableInteractive arrow>
      <Stack alignItems='center'>
        <ContentCopyIcon fontSize='small' sx={{ cursor: 'pointer' }} />
      </Stack>
    </Tooltip>
  );
}
