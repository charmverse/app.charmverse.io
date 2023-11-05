import { Button } from 'components/common/Button';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

export function OpenWalletSelectorButton({ color, label = 'Connect Wallet' }: { color?: string; label?: string }) {
  const { connectWallet } = useWeb3ConnectionManager();
  return (
    <Button variant='outlined' onClick={connectWallet} color={color}>
      {label}
    </Button>
  );
}
