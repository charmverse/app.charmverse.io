import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { ethers } from 'ethers';
import { getChainById } from 'connectors';
import useGnosisSafe from './hooks/useGnosisSafe';

export interface MultiPaymentResult {
  transactions: MetaTransactionData[];
  txHash: string;
}

interface Props {
  chainId: number,
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: MetaTransactionData[];
}

export default function MultiPaymentButton ({ chainId, safeAddress, transactions, onSuccess }: Props) {
  const { account, library } = useWeb3React();
  const safe = useGnosisSafe({ safeAddress });
  const network = getChainById(chainId);
  if (!network?.gnosisUrl) {
    throw new Error(`Invalid network: ${chainId}`);
  }
  async function makePayment () {
    if (!safe || !account || !network?.gnosisUrl) {
      return;
    }
    const safeTransaction = await safe.createTransaction(transactions);
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

  return (
    <Button disabled={!safe} onClick={makePayment}>
      Make Payment (
      {transactions.length}
      )
    </Button>
  );
}
