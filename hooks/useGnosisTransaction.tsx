import type { Transaction } from '@charmverse/core/prisma';
import { getChainById } from '@packages/connectors/chains';
import useSWR from 'swr';

import { getMantleSafeTransaction } from 'lib/gnosis/mantleClient';

import { useSafeService } from './useSafeService';

const GNOSIS_TX_BASE_URL = 'https://app.safe.global/transactions/queue?safe=';
const MANTLE_TX_BASE_URL = 'https://multisig.mantle.xyz/transactions/queue?safe=';

export function useGnosisTransaction({ tx }: { tx?: Transaction }) {
  const network = tx?.chainId ? getChainById(Number(tx.chainId)) : null;
  const safeTxHash = tx?.safeTxHash || tx?.transactionId;
  const safeService = useSafeService({ network });

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
