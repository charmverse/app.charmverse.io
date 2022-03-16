import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
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
  const { account } = useWeb3React();
  const safe = useGnosisSafe({ safeAddress });
  const network = getChainById(chainId);
  if (!network?.gnosisUrl) {
    throw new Error(`Invalid network: ${chainId}`);
  }

  async function makePayment () {
    if (!safe) return;
    const safeTransaction = await safe.createTransaction(transactions);
    await safe.signTransaction(safeTransaction);
    const txHash = await safe.getTransactionHash(safeTransaction);
    const safeService = new SafeServiceClient(network!.gnosisUrl!);
    await safeService.proposeTransaction({
      safeAddress,
      safeTransaction,
      safeTxHash: txHash,
      senderAddress: account!,
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
