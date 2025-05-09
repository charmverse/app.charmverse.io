import { ArrowDownward } from '@mui/icons-material';
import { Box, Divider, Grid, Stack, Typography } from '@mui/material';

import { useTransactionHistory } from 'charmClient/hooks/charms';
import LoadingComponent, { LoadingIcon } from 'components/common/LoadingComponent';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useUser } from 'hooks/useUser';
import { CharmActionTrigger, TRANSACTIONS_PAGE_SIZE } from '@packages/lib/charms/constants';
import type { HistoryTransaction } from '@packages/lib/charms/listTransactionsHistory';

export function CharmsHistoryTab() {
  const { user } = useUser();

  const { data, setSize, isLoading } = useTransactionHistory({
    userId: user?.id,
    pageSize: TRANSACTIONS_PAGE_SIZE
  });
  const transactions = data?.flat();
  const hasNext = data?.at(-1)?.length === TRANSACTIONS_PAGE_SIZE;

  const { formatDateTime } = useDateFormatter();

  if (!transactions) {
    return <LoadingComponent isLoading />;
  }

  if (transactions && !transactions.length) {
    return (
      <Stack gap={2} justifyContent='center' alignItems='center' my={2}>
        <Typography color='secondary'>You do not have any transactions yet</Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={2} justifyContent='center'>
      <Typography variant='subtitle1'>Your Charms transaction history</Typography>
      <Stack gap={2}>
        {transactions.map((transaction, i) => (
          <>
            <Stack direction='row' gap={1} alignItems='center' justifyContent='space-between'>
              <Stack direction='row' gap={1} alignItems='center'>
                <Stack direction='row' alignItems='center' gap={0.5} minWidth='30px'>
                  <Typography variant='subtitle1' color={transaction.metadata.isReceived ? 'primary' : 'secondary'}>
                    {transaction.metadata.isReceived ? '+' : '-'}
                    {transaction.amount}
                  </Typography>
                </Stack>

                <Typography>{getTransactionDescription(transaction)}</Typography>
              </Stack>

              <Typography color='secondary' variant='subtitle1'>
                {formatDateTime(transaction.createdAt)}
              </Typography>
            </Stack>
            <Divider />
          </>
        ))}

        {hasNext && !isLoading && (
          <Box
            display='flex'
            gap={1}
            alignItems='center'
            sx={{ cursor: 'pointer' }}
            onClick={() => setSize((s) => s + 1)}
          >
            <ArrowDownward fontSize='small' />
            <Typography fontSize='small'>Load more</Typography>
          </Box>
        )}
        {isLoading && <LoadingIcon sx={{ mx: 1 }} style={{ height: 20, width: 20 }} />}
      </Stack>
    </Stack>
  );
}

const receivedLabels: Record<CharmActionTrigger, (data: { amount: number }) => string> = {
  [CharmActionTrigger.referral]: ({ amount }) => `Received ${getAmountLabel(amount)} for a referral`,
  [CharmActionTrigger.referralReferee]: ({ amount }) => `Received ${getAmountLabel(amount)} from a referral`,
  [CharmActionTrigger.createFirstProposal]: ({ amount }) =>
    `Received ${getAmountLabel(amount)} for publishing first proposal`,
  [CharmActionTrigger.ETHDenver24ScavengerHunt]: ({ amount }) =>
    `Received ${getAmountLabel(amount)} (Eth Denver 24 Scavenger Hunt)`
};

function getTransactionDescription(transaction: HistoryTransaction) {
  if (transaction.metadata.isReceived) {
    const labelFn = transaction.metadata.actionTrigger && receivedLabels[transaction.metadata.actionTrigger];

    return labelFn ? labelFn(transaction) : `Received ${getAmountLabel(transaction.amount)}`;
  }

  if (transaction.metadata.recipientName && transaction.metadata.recipientType === 'space') {
    return `Applied ${getAmountLabel(transaction.amount)} to ${transaction.metadata.recipientName} space`;
  }

  return `Sent ${getAmountLabel(transaction.amount)}`;
}

function getAmountLabel(amount: number) {
  return `${amount} Charm${amount !== 1 ? 's' : ''}`;
}
