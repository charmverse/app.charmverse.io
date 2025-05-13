import styled from '@emotion/styled';
import Tooltip from '@mui/material/Tooltip';
import { shortenHex } from '@packages/utils/blockchain';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { Button } from 'components/common/Button';

const StyledButton = styled(Button)`
  color: inherit;
  background: transparent !important;
`;

type Props = {
  address: string;
  decimals?: number;
  sx?: any;
};

export default function CopyableAddress({ address, decimals = 3, ...rest }: Props) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <Tooltip placement='top' title={copied ? 'Copied' : `Click to copy: ${address}`} disableInteractive arrow>
      <span>
        <CopyToClipboard text={address} onCopy={onCopy}>
          <StyledButton onClick={onCopy} variant='text' {...rest}>
            {shortenHex(address, decimals)}
          </StyledButton>
        </CopyToClipboard>
      </span>
    </Tooltip>
  );
}
