import { InvalidInputError, MissingDataError } from '@charmverse/core/errors';
import { lowerCaseEqual } from '@packages/utils/strings';
import type SafeApiKit from '@safe-global/api-kit';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { useCallback, useEffect, useState } from 'react';
import useSWRImmutable from 'swr/immutable';
import { getAddress } from 'viem';

import type { MaybeString } from 'charmClient/hooks/helpers';
import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import { isSupportedSafeApiChain } from 'lib/gnosis/safe/isSupportedSafeApiChain';

import { useCreateSafes } from './useCreateSafes';
import { useWeb3Account } from './useWeb3Account';

export function useGetGnosisSafe({ address, chainId }: { chainId: number; address: MaybeString }) {
  const [safeApiClient, setSafeApiClient] = useState<SafeApiKit | null>(null);

  const { account } = useWeb3Account();

  async function initSafeClient() {
    if (chainId && isSupportedSafeApiChain(chainId).supported) {
      setSafeApiClient(await getSafeApiClient({ chainId }));
    }
  }

  useEffect(() => {
    initSafeClient();
  }, [chainId]);

  const { data: gnosisSafe, isLoading: isLoadingSafe } = useSWRImmutable(
    chainId && address && safeApiClient ? `/gnosis-safe/${address}/${chainId}` : null,
    async () => safeApiClient?.getSafeInfo(getAddress(address as string))
  );

  const currentWalletIsSafeOwner = !!account && gnosisSafe?.owners.some((owner) => lowerCaseEqual(owner, account));

  const safeClients = useCreateSafes(address ? [address] : []);

  const proposeTransaction = useCallback(
    async ({ safeTransactionData }: { safeTransactionData: MetaTransactionData }) => {
      const safeTransactionClient = safeClients?.[0];
      if (!gnosisSafe) {
        throw new MissingDataError('No gnosis safe found to propose transaction');
      } else if (!account) {
        throw new MissingDataError('No account found to sign message');
      } else if (!currentWalletIsSafeOwner) {
        throw new InvalidInputError('Current wallet is not a safe owner');
      } else if (!safeApiClient || !safeTransactionClient) {
        throw new MissingDataError('Safe transaction client or safe api client not ready. Please wait and try again.');
      }

      // Loads the next highest nonce that has not been executed. This nonce might have pending transactions.
      const nonce = await safeApiClient.getNextNonce(gnosisSafe.address);

      const safeTransaction = await safeTransactionClient.createTransaction({
        safeTransactionData: { ...safeTransactionData, nonce }
      });

      const safeTxHash = await safeTransactionClient.getTransactionHash(safeTransaction);
      const signature = await safeTransactionClient.signTransactionHash(safeTxHash);
      await safeApiClient.proposeTransaction({
        safeAddress: gnosisSafe.address,
        safeTransactionData: {
          ...safeTransaction.data,
          safeTxGas: safeTransaction.data.safeTxGas.toString(),
          baseGas: safeTransaction.data.baseGas.toString(),
          gasPrice: safeTransaction.data.gasPrice.toString()
        },
        safeTxHash,
        senderAddress: getAddress(account),
        senderSignature: signature.data
      });

      return safeTxHash;
    },
    [safeApiClient, safeClients?.[0], gnosisSafe?.address, account]
  );

  return {
    gnosisSafe,
    isLoadingSafe,
    safeApiClient,
    currentWalletIsSafeOwner,
    proposeTransaction
  };
}
