import { Button } from 'components/common/Button';

import { useWeb3ConnectionManager } from '../../Web3ConnectionManager';

export function OpenWalletSelectorButton({ color }: { color?: string }) {
  const { connectWallet } = useWeb3ConnectionManager();
  return (
    <Button variant='outlined' onClick={connectWallet} color={color}>
      Connect Wallet
    </Button>
  );
}
