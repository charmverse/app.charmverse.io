import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import SafeServiceClient from '@safe-global/safe-service-client';
import { getChainById } from 'connectors';
import { ethers, utils } from 'ethers';

import type { MultiPaymentResult } from 'components/bounties/components/MultiPaymentButton';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';

import useGnosisSafes from './useGnosisSafes';

export type GnosisPaymentProps = {
  chainId: number;
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: (MetaTransactionData & { applicationId: string })[];
};

export function useGnosisPayment({ chainId, safeAddress, transactions, onSuccess }: GnosisPaymentProps) {
  const { account, chainId: connectedChainId, library } = useWeb3AuthSig();

  const [safe] = useGnosisSafes([safeAddress]);
  const network = getChainById(chainId);
  if (!network?.gnosisUrl) {
    throw new Error(`Unsupported Gnosis network: ${chainId}`);
  }

  async function makePayment() {
    if (chainId !== connectedChainId) {
      await switchActiveNetwork(chainId);
    }

    if (!safe || !account || !network?.gnosisUrl) {
      return;
    }
    const safeTransaction = await safe.createTransaction({
      safeTransactionData: transactions.map((transaction) => ({
        data: transaction.data,
        to: transaction.to,
        value: transaction.value,
        operation: transaction.operation
      }))
    });
    const txHash = await safe.getTransactionHash(safeTransaction);
    const signer = await library.getSigner(account);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    });
    const safeService = new SafeServiceClient({ txServiceUrl: network.gnosisUrl, ethAdapter });
    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash: txHash,
      senderAddress: utils.getAddress(account),
      senderSignature: [...safeTransaction.signatures][0][0],
      origin
    });
    onSuccess({ safeAddress, transactions, txHash });
  }

  return {
    safe,
    makePayment
  };
}
