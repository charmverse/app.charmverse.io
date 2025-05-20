import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { useState } from 'react';
import { erc20Abi, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useWalletClient } from 'wagmi';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { useDevTokenBalance } from './useDevTokenBalance';

const recipientAddress = '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0';
const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';

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

      // Sign a message to verify ownership
      const message = `I authorize this DEV token transfer of ${amount} DEV to the ${space.name} charmverse space`;
      const signature = await walletClient.signMessage({ message });

      const transferTxHash = await walletClient.writeContract({
        address: devTokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipientAddress, transferredAmount]
      });

      const publicClient = getPublicClient(base.id);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: transferTxHash });

      if (receipt.status === 'success') {
        refreshBalance();
        return { hash: transferTxHash, signature, message, address, transferredAmount };
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
    isTransferring,
    transferDevToken
  };
}
