import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Tooltip from '@mui/material/Tooltip';
import { shortenHex } from 'lib/utilities/strings';
import Button from './Button';

type Props = {
  address: string
  decimals?: number,
  sx?: any
}

export default function CopyableAddress ({ address, decimals = 3, ...rest }: Props) {
  const [copied, setCopied] = useState(false);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <Tooltip
      placement='top'
      title={copied ? 'Copied' : 'Click to copy address'}
      disableInteractive
      arrow
    >
      <span>
        <CopyToClipboard text={address} onCopy={onCopy}>
          <Button onClick={onCopy} variant='text' {...rest}>
            {shortenHex(address, decimals)}
          </Button>
        </CopyToClipboard>
      </span>
    </Tooltip>
  );
}
