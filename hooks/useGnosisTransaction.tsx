import type { Transaction } from '@charmverse/core/prisma';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import SafeServiceClient from '@safe-global/safe-service-client';
import { useWeb3React } from '@web3-react/core';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useMemo } from 'react';
import useSWR from 'swr';

import { getTransaction } from 'lib/gnosis/mantleClient';

const GNOSIS_TX_BASE_URL = 'https://app.safe.global/transactions/queue?safe=';
const MANTLE_TX_BASE_URL = 'https://multisig.mantle.xyz/transactions/queue?safe=';

export function useGnosisTransaction({ tx }: { tx?: Transaction }) {
  const { library } = useWeb3React();
  const network = tx?.chainId ? getChainById(Number(tx.chainId)) : null;
  const safeTxHash = tx?.safeTxHash || tx?.transactionId;
  const ethAdapter = useMemo(
    () =>
      new EthersAdapter({
        ethers,
        signerOrProvider: library?.provider
      }),
    [library]
  );

  const safeService = useMemo(() => {
    if (!network || !network.gnosisUrl) return null;

    return new SafeServiceClient({ txServiceUrl: network.gnosisUrl, ethAdapter });
  }, [ethAdapter, network]);

  const { data: safeTxUrl } = useSWR(
    safeTxHash && safeService ? ['gnosis-transaction', safeTxHash] : null,
    async () => {
      const safeChainName = network?.shortName ? `${network?.shortName}:` : '';

      if (safeTxHash && tx && (tx.chainId === '5001' || tx.chainId === '5000')) {
        const transaction = await getTransaction({
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
