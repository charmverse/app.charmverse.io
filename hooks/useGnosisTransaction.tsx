import type { Transaction } from '@charmverse/core/prisma';
import type SafeServiceClient from '@safe-global/safe-service-client';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

import { useWeb3Account } from 'hooks/useWeb3Account';
import { getMantleSafeTransaction } from 'lib/gnosis/mantleClient';

const GNOSIS_TX_BASE_URL = 'https://app.safe.global/transactions/queue?safe=';
const MANTLE_TX_BASE_URL = 'https://multisig.mantle.xyz/transactions/queue?safe=';

export function useGnosisTransaction({ tx }: { tx?: Transaction }) {
  const network = tx?.chainId ? getChainById(Number(tx.chainId)) : null;
  const safeTxHash = tx?.safeTxHash || tx?.transactionId;
  const { provider } = useWeb3Account();
  const [safeService, setSafeService] = useState<SafeServiceClient | null>(null);

  useEffect(() => {
    const gnosisUrl = network?.gnosisUrl;
    if (!provider || !network || !gnosisUrl) return;

    import('@safe-global/safe-ethers-lib').then((ethersAdapter) => {
      const EthersAdapter = ethersAdapter.default;
      const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: provider
      });

      import('@safe-global/safe-service-client').then((safeServiceClient) => {
        const SafeServiceClient = safeServiceClient.default;
        setSafeService(new SafeServiceClient({ txServiceUrl: gnosisUrl, ethAdapter }));
      });
    });
  }, [provider, network]);

  const { data: safeTxUrl } = useSWR(
    safeTxHash && safeService ? ['gnosis-transaction', safeTxHash] : null,
    async () => {
      const safeChainName = network?.shortName ? `${network?.shortName}:` : '';

      if (safeTxHash && tx && (tx.chainId === '5001' || tx.chainId === '5000')) {
        const transaction = await getMantleSafeTransaction({
          chainId: parseInt(tx.chainId),
          safeTxHash
        });

        const safeAddress = transaction.safeAddress;

        return `${MANTLE_TX_BASE_URL}${safeChainName}${safeAddress}`;
      }

      const transaction = await safeService?.getTransaction(safeTxHash || '');
      return transaction ? `${GNOSIS_TX_BASE_URL}${safeChainName}${transaction.safe}` : '';
    }
  );

  return { safeTxUrl };
}
