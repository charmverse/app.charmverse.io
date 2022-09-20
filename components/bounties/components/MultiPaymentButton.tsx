import Button from '@mui/material/Button';
import { useWeb3React } from '@web3-react/core';
import type { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import { Tooltip } from '@mui/material';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { ethers } from 'ethers';
import { getChainById } from 'connectors';
import useGnosisSafes from 'hooks/useGnosisSafes';

export interface MultiPaymentResult {
  transactions: (MetaTransactionData & {applicationId: string})[];
  txHash: string;
}

interface Props {
  chainId: number,
  onSuccess: (result: MultiPaymentResult) => void;
  safeAddress: string;
  transactions: (MetaTransactionData & {applicationId: string})[];
  isLoading: boolean
}

export default function MultiPaymentButton ({ isLoading, chainId, safeAddress, transactions, onSuccess }: Props) {
  const { account, library } = useWeb3React();

  const [safe] = useGnosisSafes([safeAddress]);
  const network = getChainById(chainId);
  if (!network?.gnosisUrl) {
    throw new Error(`Unsupported Gnosis network: ${chainId}`);
  }
  async function makePayment () {
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

  return (
    <Tooltip arrow placement='top' title={!safe ? `Connect your wallet to the Gnosis safe: ${safeAddress}` : ''}>
      <span>
        <Button disabled={isLoading || !safe || transactions.length === 0} onClick={makePayment}>
          Make Payment ({transactions.length})
        </Button>
      </span>
    </Tooltip>
  );
}
