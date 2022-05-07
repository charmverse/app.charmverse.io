import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { UserMultiSigWallet } from '@prisma/client';
import charmClient from 'charmClient';
// import { Task } from 'models';
import { getTransactionsforSafes, GnosisTransaction } from 'lib/gnosis';
import { SafeMultisigTransactionWithTransfersResponse } from '@gnosis.pm/safe-service-client';
import useWeb3Signer from 'hooks/useWeb3Signer';
import { ethers, Signer } from 'ethers';

interface SendAction {
  to: string;
  value: string;
}

export interface GnosisTask {
  id: string;
  date: Date;
  actions: SendAction[];
  isExecuted: boolean;
  description: string;
  nonce: number;
  safeAddress: string;
  gnosisUrl: string;
}

function etherToBN (ether: string): ethers.BigNumber {
  return ethers.BigNumber.from(ethers.utils.parseEther(ether));
}

function getGnosisTransactionUrl (address: string) {
  return `https://gnosis-safe.io/app/rin:${address}/transactions/queue`;
}

function getTaskDescription (transaction: GnosisTransaction): string {
  if (transaction.dataDecoded) {
    const data = transaction.dataDecoded as any;
    switch (data.method) {
      case 'multiSend': {
        const actions = data.parameters[0].valueDecoded as { to: string, value: string }[];
        return `MultiSend (${actions.length} actions)`;
      }

      default:
        console.warn('Unknown transaction method', data.method);
    }
  }
  else if (transaction.to && transaction.value) {
    const valueBigNumber = ethers.BigNumber.from(transaction.value);
    const ethersValue = ethers.utils.formatEther(valueBigNumber);
    const upperBound = ethers.BigNumber.from(ethers.utils.parseEther('0.0001'));
    if (valueBigNumber.gt(0) && valueBigNumber.lt(upperBound)) {
      return 'Send < 0.0001 ETH';
    }
    else {
      return `Send ${ethersValue} ETH`;
    }
  }
  console.warn('Unknown transaction', transaction);
  return 'N/A';
}

// function isMultiSigTransaction (transaction: GnosisTransaction): transaction is SafeMultisigTransactionWithTransfersResponse {
//   return transaction.txType === 'MULTISIG_TRANSACTION';
// }

function getActions (transaction: GnosisTransaction): SendAction[] {
  const data = transaction.dataDecoded as any | undefined;
  if (data) {
    return data?.parameters[0].valueDecoded as { to: string, value: string }[];
  }
  return [{ to: transaction.to, value: transaction.value }];
}

function convertTransactionToTask (transaction: GnosisTransaction): GnosisTask {
  const actions = getActions(transaction);
  return {
    id: transaction.safeTxHash,
    actions,
    date: new Date(transaction.submissionDate),
    isExecuted: transaction.isExecuted,
    description: getTaskDescription(transaction),
    gnosisUrl: getGnosisTransactionUrl(transaction.safe),
    nonce: transaction.nonce,
    safeAddress: transaction.safe
  };
}

async function getPendingTasks (signer: Signer, wallets: UserMultiSigWallet[]): Promise<GnosisTask[]> {
  const transactions = await getTransactionsforSafes(signer, wallets);
  console.log(transactions);
  return transactions
    // .filter(isMultiSigTransaction)
    .map(convertTransactionToTask)
    .filter(task => !task.isExecuted)
    .sort((a, b) => a.nonce - b.nonce);
}

export default function useGnosisTasks () {

  const signer = useWeb3Signer();
  const { data } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs());
  const [tasks, setTasks] = useState<GnosisTask[]>([]);

  useEffect(() => {
    if (data && signer) {
      getPendingTasks(signer, data).then(setTasks);
    }
  }, [data, signer]);

  return tasks;
}
