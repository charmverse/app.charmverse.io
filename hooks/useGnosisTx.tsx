import { log } from '@charmverse/core/log';
import type { Transaction } from '@charmverse/core/prisma';
import type { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import SafeServiceClient from '@safe-global/safe-service-client';
import { useWeb3React } from '@web3-react/core';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';

const GNOSIS_TX_BASE_URL = 'https://app.safe.global/transactions/queue?safe=';

export function useGnosisTx({ tx }: { tx?: Transaction }) {
  const [safeTx, setSafeTx] = useState<SafeMultisigTransactionResponse | null>(null);
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

  useEffect(() => {
    const loadTx = async () => {
      if (safeTxHash && safeService) {
        try {
          const safeTxData = await safeService.getTransaction(safeTxHash);
          setSafeTx(safeTxData);
        } catch (e) {
          log.warn(e);
          setSafeTx(null);
        }
      }
    };

    loadTx();
  }, [safeService, safeTxHash]);

  const safeTxUrl = safeTx ? `${GNOSIS_TX_BASE_URL}${safeTx.safe}` : '';

  return { safeTx, safeTxUrl };
}
