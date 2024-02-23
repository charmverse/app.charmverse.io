import { Button } from 'components/common/Button';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

export function OpenWalletSelectorButton({
  size,
  color,
  label = 'Connect Wallet'
}: {
  size?: string;
  color?: string;
  label?: string;
}) {
  const { connectWallet } = useWeb3ConnectionManager();
  return (
    <Button size={size} variant='outlined' onClick={connectWallet} color={color}>
      {label}
    </Button>
  );
}
