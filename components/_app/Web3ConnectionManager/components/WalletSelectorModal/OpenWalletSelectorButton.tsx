import type { SxProps } from '@mui/material';

import { Button } from 'components/common/Button';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

export function OpenWalletSelectorButton({
  size,
  color,
  label = 'Connect Wallet',
  sx = {}
}: {
  size?: string;
  color?: string;
  label?: string;
  sx?: SxProps;
}) {
  const { connectWallet } = useWeb3ConnectionManager();
  return (
    <Button sx={sx} size={size} variant='outlined' onClick={connectWallet} color={color}>
      {label}
    </Button>
  );
}
