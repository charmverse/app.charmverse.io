import type { User, UserGnosisSafe, UserNotification, UserNotificationState, UserWallet } from '@prisma/client';
import { ethers } from 'ethers';
import groupBy from 'lodash/groupBy';
import intersection from 'lodash/intersection';

import { prisma } from 'db';
import log from 'lib/log';

import type { GnosisTransaction } from './gnosis';
import { getTransactionsforSafes } from './gnosis';
import { getFriendlyEthValue, getGnosisTransactionQueueUrl } from './utils';

const providerKey = process.env.ALCHEMY_API_KEY;
const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${providerKey}`;

type UserWithGnosisSafeState = User & { notificationState: UserNotificationState | null };
interface ActionUser {
  address: string;
  user?: UserWithGnosisSafeState;
}

interface SendAction {
  deadline?: string;
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
  safeChainId: number;
  threshold: number;
  snoozedUsers: UserWithGnosisSafeState[];
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
  taskId: string;
  marked: boolean;
}

function getTaskDescription(transaction: GnosisTransaction): string {
  if (transaction.dataDecoded) {
    const data = transaction.dataDecoded as any;
    switch (data.method) {
      case 'multiSend': {
        const actions = data.parameters[0].valueDecoded as { to: string; value: string }[];
        return `MultiSend: ${actions.length} actions`;
      }
      case 'transfer': {
        try {
          const recipient = data.parameters[0].value;
          const amount = data.parameters[1].value;
          return `Transfer: ${amount} to ${recipient}`;
        } catch (error) {
          log.error('Error parsing gnosis transfer', { error, data });
        }
        break;
      }

      case 'swapOwner':
        return 'Swap Owner';

      case 'signMessage':
        return 'Sign a message';

      case 'addOwnerWithThreshold': {
        // this is the JSON type in case we want it for something
        // const params = data.parameters as { name: '_threshold' | 'owner', value: string }[];
        /* example
          {
            method: 'addOwnerWithThreshold',
            parameters: [
              {
                name: 'owner',
                type: 'address',
                value: '0x78d32460D0a53Ac2678e869Eb6b4f6bA9d2Ef360'
              },
              { name: '_threshold', type: 'uint256', value: '3' }
            ]
          }
        */
        return 'Add a new owner';
      }

      default:
        log.warn(`Unknown transaction method: ${data.method}`, transaction);
        return `Transaction method: ${data.method}`;
    }
  } else if (transaction.to && transaction.value) {
    return `Send ${getFriendlyEthValue(transaction.value)} ETH`;
  }
  return 'Unknown transaction type';
}

type PaymentAction = { decodedValue: { to: string; value: string }[] }; // TODO: find out the type and name of this action (it is used when there are multiple recipients)
type DeadlineAction = { name: 'deadline'; type: 'uint256'; value: number };
type DataAction = { name: 'data'; type: 'bytes[]'; value: string[] };
type TransactionParameter = PaymentAction | DeadlineAction | DataAction;

function getTaskActions(transaction: GnosisTransaction, getRecipient: (address: string) => ActionUser): SendAction[] {
  const data = transaction.dataDecoded as any | undefined;
  const parameters: TransactionParameter[] = data?.parameters ?? [];
  // console.log('response', transaction);
  // console.log('data', data?.parameters);
  const paymentActions =
    parameters
      .filter((action): action is PaymentAction => !!(action as PaymentAction).decodedValue?.[0].to)
      .map((action) => action.decodedValue)
      .flat() || [];
  // its possible for there to be data in 'valueDecoded' that is not a payment action. TODO: find out what other cases exist
  if (paymentActions.length > 0) {
    paymentActions.push({ to: transaction.to, value: transaction.value });
  }
  const deadline = parameters.find((action) => (action as DeadlineAction).name === 'deadline') as DeadlineAction;
  const deadlineValue = deadline?.value ? new Date(deadline.value * 1000).toISOString() : undefined;

  return paymentActions.map((action) => ({
    value: action.value,
    deadline: deadlineValue,
    friendlyValue: getFriendlyEthValue(action.value),
    to: getRecipient(action.to)
  }));
}

interface TransactionToTaskProps {
  myAddresses: string[];
  transaction: GnosisTransaction;
  safe: UserGnosisSafe;
  wallets: (UserWallet & { user: UserWithGnosisSafeState })[];
}

function transactionToTask({
  myAddresses,
  transaction,
  safe,
  wallets
}: TransactionToTaskProps): GnosisTransactionPopulated {
  const actions = getTaskActions(transaction, getRecipient);
  const gnosisUrl = getGnosisTransactionQueueUrl(transaction.safe, safe.chainId);
  const confirmedAddresses = transaction.confirmations?.map((confirmation) => confirmation.owner) ?? [];
  const myOwnedAddresses = intersection(myAddresses, safe.owners).length; // handle owner of multiple addresses in one safe
  // console.log('transaction', transaction);
  let actionLabel: string = '';
  if (transaction.confirmations && transaction.confirmations.length >= safe.threshold) {
    actionLabel = 'Execute';
  } else if (intersection(myAddresses, confirmedAddresses).length < myOwnedAddresses) {
    actionLabel = 'Sign';
    if (transaction.confirmations && transaction.confirmations.length - safe.threshold === 1) {
      actionLabel = 'Execute';
    }
  }

  function getRecipient(address: string) {
    const user = wallets.find((w) => w.address === address)?.user;
    return { address, user };
  }

  const confirmations = transaction.confirmations?.map((confirmation) => getRecipient(confirmation.owner)) ?? [];
  const snoozedUsers: UserWithGnosisSafeState[] = [];
  wallets.forEach(({ user }) => {
    if (
      user.notificationState &&
      user.notificationState.snoozedUntil !== null &&
      !confirmations.find((confirmation) =>
        wallets.some((w) => w.userId === user.id && w.address === confirmation.address)
      ) &&
      user.notificationState.snoozedUntil.toString() > new Date().toString()
    ) {
      snoozedUsers.push(user);
    }
  });

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
    safeChainId: safe.chainId,
    confirmations,
    threshold: safe.threshold,
    myAction: actionLabel,
    myActionUrl: gnosisUrl,
    snoozedUsers
  };
}

interface TransactionsToTaskProps {
  transactions: GnosisTransaction[];
  safes: UserGnosisSafe[];
  myUserId: string;
  wallets: (UserWallet & { user: UserWithGnosisSafeState })[];
}

async function transactionsToTasks({
  transactions,
  safes,
  myUserId,
  wallets
}: TransactionsToTaskProps): Promise<GnosisSafeTasks[]> {
  const userMultisigNotificationsRecord = (
    await prisma.userNotification.findMany({
      where: {
        type: 'multisig',
        userId: myUserId
      }
    })
  ).reduce<Record<string, UserNotification>>((merged, multisigNotification) => {
    merged[multisigNotification.taskId] = multisigNotification;
    return merged;
  }, {});

  const myAddresses = (wallets.filter((wallet) => wallet.userId === myUserId) ?? []).map((w) => w.address);
  const safesByAddress = safes.reduce<Record<string, UserGnosisSafe>>(
    (acc, safe) => ({ ...acc, [safe.address]: safe }),
    {}
  );

  const mapped = transactions.map((transaction) =>
    transactionToTask({
      myAddresses,
      safe: safesByAddress[transaction.safe],
      transaction,
      wallets
    })
  );

  return Object.values(groupBy(mapped, 'safeAddress'))
    .map<GnosisSafeTasks>((_transactions) => {
      const tasks = Object.values(groupBy(_transactions, 'nonce'))
        .map<GnosisTask>((__transactions) => ({ nonce: __transactions[0].nonce, transactions: __transactions }))
        .sort((a, b) => a.nonce - b.nonce);
      const taskId = tasks[0].transactions[0].id;
      return {
        taskId,
        safeAddress: _transactions[0].safeAddress,
        safeName: _transactions[0].safeName,
        safeUrl: getGnosisTransactionQueueUrl(_transactions[0].safeAddress, _transactions[0].safeChainId),
        tasks,
        marked: !!userMultisigNotificationsRecord[taskId]
      };
    })
    .sort((safeA, safeB) => (safeA.safeAddress > safeB.safeAddress ? -1 : 1));
}

export async function getPendingGnosisTasks(myUserId: string) {
  if (!providerKey) {
    log.warn('Skip gnosis request: Alchemy API Key is missing');
    return [];
  }

  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const safeOwner = provider.getSigner(0);

  const safes = await prisma.userGnosisSafe.findMany({
    where: {
      userId: myUserId
    }
  });

  const transactions = await getTransactionsforSafes(safeOwner, safes);

  const userAddresses = safes.map((safe) => safe.owners).flat();
  const wallets = await prisma.userWallet.findMany({
    where: {
      address: {
        in: userAddresses
      }
    },
    include: {
      user: {
        include: {
          notificationState: true
        }
      }
    }
  });

  return transactionsToTasks({ transactions, safes, myUserId, wallets });
}
