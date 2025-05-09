import { getLogger } from '@charmverse/core/log';
import { BaseError } from 'viem';

import { useSnackbar } from 'hooks/useSnackbar';
import { useWalletClient } from 'hooks/wagmi';
import { reservoirClient } from '@packages/lib/blockchain/reservoirClient';

const log = getLogger('reservoir');

const REFERRER_ADDRESS = '0x1cD919942a8EF3e867Fe9C0813BC4851090cF037'; // charmverse.eth

export type TokenToMint = {
  namespace: string;
  chainId: number;
  address: string;
  tokenId?: string;
};

export function useReservoir() {
  const { data: walletClient } = useWalletClient();
  const { showMessage, showError } = useSnackbar();

  const mintNFT = async (tokenDetails: TokenToMint, takerAddress?: string) => {
    const { chainId, address, tokenId } = tokenDetails;

    const currentChain = walletClient?.chain.id;

    if (!walletClient?.account) {
      showError('Wallet not connected');
      return;
    }

    if (currentChain !== chainId) {
      showError('Wrong chain');
      return;
    }

    const mintItem = tokenId
      ? { token: `${address}:${tokenId}`, quantity: 1, referrer: REFERRER_ADDRESS }
      : { collection: address, quantity: 1, referrer: REFERRER_ADDRESS };

    try {
      let txHash = '';

      const res = await reservoirClient.actions.mintToken({
        chainId,
        wallet: walletClient,
        items: [mintItem],
        onProgress: (steps) => {
          const stepItem = steps[0]?.items?.[0];
          log.info('[mint step]', steps[0]);

          if (stepItem?.status === 'complete') {
            showError('Failed to mint NFT');
            txHash = stepItem?.txHashes?.[0].txHash || '';
          }
        },
        options: takerAddress
          ? {
              taker: takerAddress,
              relayer: walletClient.account.address
            }
          : {}
      });

      return {
        txHash: txHash || null,
        chainId,
        res
      };
    } catch (e: any) {
      if (e instanceof BaseError && e.shortMessage) {
        showMessage(e.shortMessage, 'error');
        return;
      }

      const message = e.message || 'Failed to mint NFT';
      showMessage(message, 'error');
    }
  };

  return { mintNFT };
}
