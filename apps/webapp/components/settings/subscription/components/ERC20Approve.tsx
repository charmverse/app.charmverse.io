import { log } from '@charmverse/core/log';
import type { ButtonProps } from '@mui/material';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import type { Address } from 'viem';
import { useSwitchChain, useWalletClient } from 'wagmi';

import { Button } from 'components/common/Button';

import { useUpdateERC20Allowance } from '../hooks/useUpdateERC20Allowance';

// Component for approving ERC20 tokens
type ERC20ApproveButtonProps = {
  onSuccess: () => void;
  amount?: bigint; // Optional amount input
  spender: Address;
  chainId: number;
  erc20Address: Address;
  decimals?: number;
  currency?: string;
  actionType: 'mint' | 'purchase' | 'bid';
  color?: ButtonProps['color'];
  hideWarning?: boolean;
};

export function ERC20ApproveButton({
  onSuccess,
  amount,
  chainId,
  erc20Address,
  spender,
  // Default to decimals for USDC
  decimals = 6,
  currency = 'USDC',
  actionType,
  color = 'primary',
  hideWarning = false
}: ERC20ApproveButtonProps) {
  const amountToApprove = amount ? amount + amount / BigInt(50) : undefined;

  const { data: walletClient } = useWalletClient();

  const { switchChainAsync } = useSwitchChain();

  const { triggerApproveSpender, isApprovingSpender } = useUpdateERC20Allowance({ chainId, erc20Address, spender });

  async function approveSpender() {
    if (walletClient?.chain.id !== chainId) {
      try {
        await switchChainAsync({ chainId });
      } catch (error) {
        // some wallets dont support switching chain
        log.warn('Error switching chain for approve spend', { chainId, error });
      }
    }
    if (!amountToApprove) {
      throw new Error('Amount to approve is required');
    }
    try {
      await triggerApproveSpender({ amount: amountToApprove });
      onSuccess();
    } catch (error) {
      onSuccess();
      log.error('Error approving spend', { error });
    }
  }

  const displayAmount = (Number(amountToApprove || 0) / 10 ** decimals).toFixed(2);

  return (
    <Stack>
      <Button
        loading={isApprovingSpender}
        variant='contained'
        color={color}
        onClick={approveSpender}
        disabled={isApprovingSpender}
        data-test='approve-spending-nft-purchase-button'
      >
        {isApprovingSpender ? 'Approving...' : `Approve ${displayAmount} ${currency}`}
      </Button>
      {!hideWarning && (
        <Typography sx={{ mb: 1 }} variant='caption'>
          You must approve the {currency} spend before you can send tokens to the space
        </Typography>
      )}
    </Stack>
  );
}
