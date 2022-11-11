import type { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import { useWeb3React } from '@web3-react/core';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';

import type { MultiPaymentResult } from 'components/bounties/components/MultiPaymentButton';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';

import useGnosisSafes from './useGnosisSafes';

export type GnosisPaymentProps = {
  chainId: number;
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
}

export function useGnosisPayment ({
  chainId, safeAddress, transactions, onSuccess
}: GnosisPaymentProps) {

  const { account, chainId: connectedChainId, library } = useWeb3React();

  const [safe] = useGnosisSafes([safeAddress]);
  const network = getChainById(chainId);
  if (!network?.gnosisUrl) {
    throw new Error(`Unsupported Gnosis network: ${chainId}`);
  }

  async function makePayment () {

    if (chainId !== connectedChainId) {
      await switchActiveNetwork(chainId);
    }

    if (!safe || !account || !network?.gnosisUrl) {
      return;
    }
    const safeTransaction = await safe.createTransaction(transactions.map(transaction => (
      {
        data: transaction.data,
        to: transaction.to,
        value: transaction.value,
        operation: transaction.operation
      }
    )));
    await safe.signTransaction(safeTransaction);
    const txHash = await safe.getTransactionHash(safeTransaction);
    const signer = await library.getSigner(account);
    const ethAdapter = new EthersAdapter({
      ethers,
      signer
    });
    const safeService = new SafeServiceClient({ txServiceUrl: network.gnosisUrl, ethAdapter });
    await safeService.proposeTransaction({
      safeAddress,
      safeTransaction,
      safeTxHash: txHash,
      senderAddress: account,
      origin
    });
    onSuccess({ transactions, txHash });
  }

  return {
    safe,
    makePayment
  };
}
