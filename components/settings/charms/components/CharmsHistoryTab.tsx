import { ArrowDownward } from '@mui/icons-material';
import { Box, CircularProgress, Divider, Grid, Stack, Typography } from '@mui/material';

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
              <Grid item xs={1}>
                <Stack direction='row' alignItems='center' gap={0.5}>
                  <Typography variant='subtitle1'>
                    {transaction.metadata.isReceived ? '+' : '-'}
                    {transaction.amount}
                  </Typography>
                  <Typography variant='caption' color='secondary'>
                    Charms
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={8}>
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

const receivedLabels: Record<CharmActionTrigger, string> = {
  [CharmActionTrigger.referral]: 'Invited member to space'
};

function getTransactionDescription(transaction: HistoryTransaction) {
  if (transaction.metadata.isReceived) {
    return (
      (transaction.metadata.actionTrigger && receivedLabels[transaction.metadata.actionTrigger]) ||
      'You have received Charms'
    );
  }

  if (transaction.metadata.recipientName && transaction.metadata.recipientType === 'space') {
    return `You have applied Charms to ${transaction.metadata.recipientName} space`;
  }

  return 'You have sent Charms';
}
