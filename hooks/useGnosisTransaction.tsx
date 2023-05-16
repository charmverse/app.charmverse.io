import type { Transaction } from '@charmverse/core/prisma';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import SafeServiceClient from '@safe-global/safe-service-client';
import { useWeb3React } from '@web3-react/core';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useMemo } from 'react';
import useSWR from 'swr';

const GNOSIS_TX_BASE_URL = 'https://app.safe.global/transactions/queue?safe=';

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

  const { data: safeTx } = useSWR(safeTxHash && safeService ? ['gnosis-transaction', safeTxHash] : null, () =>
    safeService?.getTransaction(safeTxHash || '')
  );

  const safeChainName = network?.shortName ? `${network?.shortName}:` : '';
  const safeTxUrl = safeTx ? `${GNOSIS_TX_BASE_URL}${safeChainName}${safeTx.safe}` : '';

  return { safeTx, safeTxUrl };
}
