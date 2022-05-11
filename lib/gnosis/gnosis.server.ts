import { ethers } from 'ethers';
import log from 'lib/log';
import groupBy from 'lodash/groupBy';
import { getChainById } from 'connectors';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import { prisma } from 'db';
import { getTransactionsforSafes, GnosisTransaction } from './gnosis';

const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;

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

export interface GnosisSafeTasks {
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
  console.log('transaction', transaction);
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

export async function getPendingGnosisTasks (userId: string) {

  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const safeOwner = provider.getSigner(0);

  const ethAdapter = new EthersAdapter({
    ethers,
    signer: safeOwner
  });

  const wallets = await prisma.userMultiSigWallet.findMany({
    where: {
      userId
    }
  });
  const transactions = await getTransactionsforSafes(safeOwner, wallets);
  const tasks = transactionsToTasks({ transactions, myAddresses: [] });

  return tasks;
}
