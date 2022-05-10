import { useEffect, useState } from 'react';
import groupBy from 'lodash/groupBy';
import useSWR from 'swr';
import charmClient from 'charmClient';
import { getTransactionsforSafes, GnosisTransaction } from 'lib/gnosis';
import useWeb3Signer from 'hooks/useWeb3Signer';
import { ethers } from 'ethers';
import log from 'lib/log';
import { SafeMultisigTransactionResponse } from '@gnosis.pm/safe-service-client';
import { useUser } from 'hooks/useUser';

interface SendAction {
  to: string;
  value: string;
}

interface GnosisTransactionPopulated {
    id: string;
    date: Date;
    actions: SendAction[];
    isExecuted: boolean;
    description: string;
    nonce: number;
    safeAddress: string;
    gnosisUrl: string;
    action: string;
    actionUrl: string;
}

export interface GnosisTask {
  nonce: number;
  transactions: GnosisTransactionPopulated[];
}

interface GnosisSafeTasks {
  safeAddress: string;
  safeUrl: string;
  tasks: GnosisTask[];
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
  log.warn('Unknown transaction', transaction);
  return 'N/A';
}

// function isMultiSigTransaction (transaction: GnosisTransaction): transaction is SafeMultisigTransactionWithTransfersResponse {
//   return transaction.txType === 'MULTISIG_TRANSACTION';
// }

function getTaskActions (transaction: GnosisTransaction): SendAction[] {
  const data = transaction.dataDecoded as any | undefined;
  if (data) {
    return data?.parameters[0].valueDecoded as { to: string, value: string }[];
  }
  return [{ to: transaction.to, value: transaction.value }];
}

function transactionToTask ({ myAddresses, transaction }: { myAddresses: string[], transaction: GnosisTransaction }): GnosisTransactionPopulated {
  const actions = getTaskActions(transaction);
  const gnosisUrl = getGnosisTransactionUrl(transaction.safe);
  return {
    id: transaction.safeTxHash,
    actions,
    date: new Date(transaction.submissionDate),
    isExecuted: transaction.isExecuted,
    description: getTaskDescription(transaction),
    gnosisUrl,
    nonce: transaction.nonce,
    safeAddress: transaction.safe,
    action: 'Sign',
    actionUrl: gnosisUrl
  };
}

function transactionsToTasks ({ transactions, myAddresses }: { transactions: GnosisTransaction[], myAddresses: string[] }): GnosisSafeTasks[] {

  const mapped = transactions.map(transaction => transactionToTask({ myAddresses, transaction }));

  return Object.values(groupBy(mapped, 'safeAddress'))
    .map<GnosisSafeTasks>((_transactions) => ({
      safeAddress: _transactions[0].safeAddress,
      safeUrl: getGnosisTransactionUrl(_transactions[0].safeAddress),
      tasks: Object.values(groupBy(_transactions, 'nonce'))
        .map<GnosisTask>(__transactions => ({ nonce: __transactions[0].nonce, transactions: __transactions }))
        .sort((a, b) => a.nonce - b.nonce)
    }))
    .sort((safeA, safeB) => safeA.safeAddress > safeB.safeAddress ? -1 : 1);
}

export default function useGnosisTasks () {

  const signer = useWeb3Signer();
  const [user] = useUser();
  const { data: wallets } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs());
  const [transactions, setTransactions] = useState<SafeMultisigTransactionResponse[] | null>(null);
  const [tasks, setTasks] = useState<GnosisSafeTasks[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallets && signer) {
      getTransactionsforSafes(signer, wallets)
        .then(setTransactions)
        .catch(err => setError(err.message || err));
    }
  }, [wallets, signer]);

  useEffect(() => {
    console.log('transactions', transactions, user);
    if (transactions && user) {
      console.log('set tasks');
      const _tasks = transactionsToTasks({ transactions, myAddresses: user.addresses });
      setTasks(_tasks);
      console.log('done set tasks', _tasks);
    }
  }, [transactions, user]);

  return { tasks, error };
}
