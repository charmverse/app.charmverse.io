import { ArrowDownward } from '@mui/icons-material';
import { Box, Divider, Grid, Stack, Typography } from '@mui/material';

import { useTransactionHistory } from 'charmClient/hooks/charms';
import LoadingComponent, { LoadingIcon } from 'components/common/LoadingComponent';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useUser } from 'hooks/useUser';
import { CharmActionTrigger, TRANSACTIONS_PAGE_SIZE } from 'lib/charms/constants';
import type { HistoryTransaction } from 'lib/charms/listTransactionsHistory';

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
            <Grid key={transaction.id} container display='flex' gap={1} alignItems='center'>
              <Grid item xs={0.5}>
                <Stack direction='row' alignItems='center' gap={0.5}>
                  <Typography
                    variant='subtitle1'
                    color={transaction.metadata.isReceived ? ({ palette }) => palette.primary.main : 'secondary'}
                  >
                    {transaction.metadata.isReceived ? '+' : '-'}
                    {transaction.amount}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={9}>
                <Typography>{getTransactionDescription(transaction)}</Typography>
              </Grid>
              <Grid item xs={2} justifyContent='flex-end'>
                <Typography color='secondary' variant='subtitle1'>
                  {formatDateTime(transaction.createdAt)}
                </Typography>
              </Grid>
            </Grid>
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
