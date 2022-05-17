import { ethers } from 'ethers';
import log from 'lib/log';
import groupBy from 'lodash/groupBy';
import intersection from 'lodash/intersection';
import { prisma } from 'db';
import { User, UserGnosisSafe } from '@prisma/client';
import { getTransactionsforSafes, GnosisTransaction } from './gnosis';

const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;

interface ActionUser {
  address: string;
  user?: User;
}

interface SendAction {
  to: ActionUser;
  value: string;
  friendlyValue: string;
}

export interface GnosisTransactionPopulated {
  id: string;
  actions: SendAction[];
  date: string;
  confirmations: ActionUser[];
  isExecuted: boolean;
  description: string;
  gnosisUrl: string;
  myAction: string;
  myActionUrl: string;
  nonce: number;
  safeAddress: string;
  safeName: string | null;
  threshold: number;
}

export interface GnosisTask {
  nonce: number;
  transactions: GnosisTransactionPopulated[];
}

export interface GnosisSafeTasks {
  safeAddress: string;
  safeName: string | null;
  safeUrl: string;
  tasks: GnosisTask[];
  snoozedUsers: User[]
}

function etherToBN (ether: string): ethers.BigNumber {
  return ethers.BigNumber.from(ethers.utils.parseEther(ether));
}

function getFriendlyEthValue (value: string) {
  const valueBigNumber = ethers.BigNumber.from(value);
  const ethersValue = ethers.utils.formatEther(valueBigNumber);
  const upperBound = ethers.BigNumber.from(ethers.utils.parseEther('0.001'));
  if (valueBigNumber.gt(0) && valueBigNumber.lt(upperBound)) {
    return '< 0.0001';
  }
  else {
    return ethersValue;
  }
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
        return `MultiSend: ${actions.length} actions`;
      }

      default:
        console.warn('Unknown transaction method', data.method);
    }
  }
  else if (transaction.to && transaction.value) {
    return `Send ${getFriendlyEthValue(transaction.value)} ETH`;
  }
  log.warn('Unknown transaction', transaction);
  return 'N/A';
}

function getTaskActions (transaction: GnosisTransaction, getRecipient: (address: string) => ActionUser): SendAction[] {
  const data = transaction.dataDecoded as any | undefined;
  const actions = data
    ? data?.parameters[0].valueDecoded as { to: string, value: string }[]
    : [{ to: transaction.to, value: transaction.value }];

  return actions.map(action => ({
    value: action.value,
    friendlyValue: getFriendlyEthValue(action.value),
    to: getRecipient(action.to)
  }));
}

interface TransactionToTaskProps {
  myAddresses: string[];
  transaction: GnosisTransaction;
  safe: UserGnosisSafe;
  users: User[];
}

function transactionToTask ({ myAddresses, transaction, safe, users }: TransactionToTaskProps): GnosisTransactionPopulated {
  const actions = getTaskActions(transaction, getRecipient);
  const gnosisUrl = getGnosisTransactionUrl(transaction.safe);
  const confirmedAddresses = transaction.confirmations?.map(confirmation => confirmation.owner) ?? [];
  // console.log('transaction', transaction);
  let actionLabel: string = '';
  if (transaction.confirmations && transaction.confirmations.length >= safe.threshold) {
    actionLabel = 'Execute';
  }
  else if (intersection(myAddresses, confirmedAddresses).length === 0) {
    actionLabel = 'Sign';
    if (transaction.confirmations && transaction.confirmations.length - safe.threshold === 1) {
      actionLabel = 'Execute';
    }
  }

  function getRecipient (address: string) {
    const user = users.find(u => u.addresses.includes(address));
    return { address, user };
  }

  return {
    id: transaction.safeTxHash,
    actions,
    date: transaction.submissionDate,
    isExecuted: transaction.isExecuted,
    description: getTaskDescription(transaction),
    gnosisUrl,
    nonce: transaction.nonce,
    safeAddress: transaction.safe,
    safeName: safe.name,
    confirmations: transaction.confirmations?.map(confirmation => getRecipient(confirmation.owner)) ?? [],
    threshold: safe.threshold,
    myAction: actionLabel,
    myActionUrl: gnosisUrl
  };
}

interface TransactionsToTaskProps {
  transactions: GnosisTransaction[];
  safes: UserGnosisSafe[];
  myUserId: string;
  users: User[];
}

function transactionsToTasks ({ transactions, safes, myUserId, users }: TransactionsToTaskProps): GnosisSafeTasks[] {
  const myAddresses = users.find(user => user.id === myUserId)?.addresses ?? [];
  const safesByAddress = safes.reduce<Record<string, UserGnosisSafe>>((acc, safe) => ({ ...acc, [safe.address]: safe }), {});

  const mapped = transactions.map(transaction => transactionToTask({
    myAddresses,
    safe: safesByAddress[transaction.safe],
    transaction,
    users
  }));

  const snoozedUsers: User[] = [];
  users.forEach(user => {
    if (user.transactionsSnoozedFor !== null) {
      snoozedUsers.push(user);
    }
  });

  return Object.values(groupBy(mapped, 'safeAddress'))
    .map<GnosisSafeTasks>((_transactions) => ({
      safeAddress: _transactions[0].safeAddress,
      safeName: _transactions[0].safeName,
      safeUrl: getGnosisTransactionUrl(_transactions[0].safeAddress),
      tasks: Object.values(groupBy(_transactions, 'nonce'))
        .map<GnosisTask>(__transactions => ({ nonce: __transactions[0].nonce, transactions: __transactions }))
        .sort((a, b) => a.nonce - b.nonce),
      snoozedUsers
    }))
    .sort((safeA, safeB) => safeA.safeAddress > safeB.safeAddress ? -1 : 1);
}

export async function getPendingGnosisTasks (myUserId: string) {

  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const safeOwner = provider.getSigner(0);

  const safes = await prisma.userGnosisSafe.findMany({
    where: {
      userId: myUserId
    }
  });

  const transactions = await getTransactionsforSafes(safeOwner, safes);

  const userAddresses = safes.map(safe => safe.owners).flat();
  const users = await prisma.user.findMany({
    where: {
      addresses: {
        hasSome: userAddresses
      }
    }
  });

  const tasks = transactionsToTasks({ transactions, safes, myUserId, users });

  return tasks;
}
