import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { log } from '@packages/core/log';
import { charmVerseBankAddress, devTokenAddress } from '@packages/subscriptions/constants';
import { useState } from 'react';
import { erc20Abi, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useWalletClient } from 'wagmi';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { useDevTokenBalance } from './useDevTokenBalance';

export function useTransferDevToken() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showMessage } = useSnackbar();
  const [isTransferring, setIsTransferring] = useState(false);
  const { space } = useCurrentSpace();

  const { formattedBalance, isLoading: isBalanceLoading, refreshBalance } = useDevTokenBalance({ address });

  const transferDevToken = async (amount: number) => {
    if (!walletClient || !address || !space || isBalanceLoading || isTransferring) {
      return;
    }

    if (formattedBalance < amount) {
      showMessage('Insufficient balance', 'error');
      return;
    }

    setIsTransferring(true);

    try {
      if (amount === 0) {
        return;
      }

      if (walletClient.chain.id !== 8453) {
        try {
          await walletClient.switchChain({
            id: 8453
          });
        } catch (error) {
          log.warn('Error switching chain for space contribution', { error });
        }
      }

      const transferredAmount = parseUnits(amount.toString(), 18);

      const transferTxHash = await walletClient.writeContract({
        address: devTokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [charmVerseBankAddress, transferredAmount]
      });

      const publicClient = getPublicClient(base.id);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: transferTxHash });

      if (receipt.status === 'success') {
        refreshBalance();
        return { hash: transferTxHash, address, transferredAmount };
      } else {
        showMessage('Transaction failed', 'error');
      }
    } catch (error) {
      log.error('Error transferring DEV token', { error });
      showMessage('Failed to transfer DEV token. Please try again later.', 'error');
    } finally {
      setIsTransferring(false);
    }
    return null;
  };

  return {
    address,
    formattedBalance,
    isTransferring,
    transferDevToken
  };
}
