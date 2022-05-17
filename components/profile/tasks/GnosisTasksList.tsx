import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Alert, Box, Card, Chip, Collapse, Divider, Grid, TextField, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PeopleIcon from '@mui/icons-material/People';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import UserDisplay, { AnonUserDisplay } from 'components/common/UserDisplay';
import { shortenHex } from 'lib/utilities/strings';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { useUser } from 'hooks/useUser';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import { GnosisTask, GnosisTransactionPopulated } from 'lib/gnosis/gnosis.tasks';
import SnoozeIcon from '@mui/icons-material/Snooze';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import charmClient from 'charmClient';
import { GnosisConnectCard } from '../integrations/GnosisSafes';
import useTasks from './hooks/useTasks';

const rowHeight = 48;

const GridColumn = styled((props: any) => <Grid item xs {...props} />)`
  display: flex;
  align-items: center;
`;

function TransactionRow ({ snoozedAddresses, transaction }: { snoozedAddresses: string[], transaction: GnosisTransactionPopulated }) {

  const [expanded, setExpanded] = useState(false);
  const isReadyToExecute = transaction.confirmations?.length === transaction.threshold;

  return (
    <>
      <Grid container key={transaction.id} sx={{ height: rowHeight }} onClick={() => setExpanded(!expanded)}>
        <GridColumn>
          {transaction.description}
        </GridColumn>
        <GridColumn>
          {DateTime.fromISO(transaction.date).toRelative({ base: DateTime.now() })}
        </GridColumn>
        <GridColumn>
          <Typography variant='caption' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: isReadyToExecute ? 'bold' : '' }}>
            <PeopleIcon color='secondary' fontSize='small' /> {transaction.confirmations?.length || 0} out of {transaction.threshold}
          </Typography>
        </GridColumn>
        <GridColumn sx={{ justifyContent: 'flex-end' }}>
          <Chip
            clickable={!!transaction.myAction}
            component='a'
            label={transaction.myAction || 'Waiting for others'}
            href={transaction.myActionUrl}
            target='_blank'
            color={transaction.myAction ? 'primary' : undefined}
            variant={transaction.myAction ? 'filled' : 'outlined'}
          />
        </GridColumn>
        <GridColumn sx={{ flexGrow: '0 !important' }}>
          <Box sx={{ width: 60, display: 'flex', justifyContent: 'center' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </GridColumn>
      </Grid>
      <Collapse in={expanded}>
        <Divider />
        <Box py={1} pl={4} sx={{ bgcolor: 'background.light' }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              {transaction.actions.map(action => (
                <Box py={1}>
                  <Typography gutterBottom>
                    Sending <strong>{action.friendlyValue}</strong> to:
                  </Typography>
                  {action.to.user ? <UserDisplay avatarSize='small' user={action.to.user} /> : <AnonUserDisplay avatarSize='small' address={action.to.address} />}
                </Box>
              ))}
            </Grid>
            <Grid item xs={1}>
              <Divider orientation='vertical' />
            </Grid>
            <Grid item xs={5}>
              <Typography color='secondary' gutterBottom variant='body2'>Confirmations</Typography>
              {transaction.confirmations.map(confirmation => (
                <Box py={1}>
                  {confirmation.user ? <UserDisplay avatarSize='small' user={confirmation.user} /> : <AnonUserDisplay avatarSize='small' address={confirmation.address} />}
                </Box>
              ))}
              <Typography color='secondary' gutterBottom variant='body2'>Snoozed Addresses</Typography>
              {snoozedAddresses.map(snoozedAddress => (
                <Box py={1}>
                  <AnonUserDisplay avatarSize='small' address={snoozedAddress} />
                </Box>
              ))}
            </Grid>
          </Grid>
        </Box>
        <Divider />
      </Collapse>
    </>
  );
}

function SafeTasks (
  { snoozedAddresses, address, safeName, safeUrl, tasks }:
  { snoozedAddresses: string[], address: string, safeName: string | null, safeUrl: string, tasks: GnosisTask[] }
) {
  const [currentUser] = useUser();
  const [isSnoozed, setIsSnoozed] = useState(currentUser?.transactionsSnoozed ?? false);
  const [snoozedForDate, setSnoozedForDate] = useState<null | DateTime>(
    (currentUser?.transactionsSnoozedFor as any) ?? null
  );

  async function toggleSnoozed () {
    const updatedSnoozedStatus = !isSnoozed;
    const nextDayDate = DateTime.fromMillis(Date.now()).plus({ day: 1 });
    await charmClient.snoozeTransactions({
      snooze: updatedSnoozedStatus,
      snoozeFor: isSnoozed ? null : nextDayDate.toJSDate()
    });
    setSnoozedForDate(isSnoozed ? null : nextDayDate);
    setIsSnoozed(updatedSnoozedStatus);
  }

  return (
    <>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='inherit'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Tasks from safe:
          <Link
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5
            }}
            href={safeUrl}
            external
            target='_blank'
          >{safeName || shortenHex(address)} <OpenInNewIcon fontSize='small' />
          </Link>
        </Typography>
        <Box display='flex' gap={1} alignItems='center'>
          <SnoozeIcon
            sx={{
              cursor: 'pointer'
            }}
            color={isSnoozed ? 'primary' : 'secondary'}
            onClick={toggleSnoozed}
          />
          {isSnoozed && (
          <DateTimePicker
            value={snoozedForDate}
            onAccept={(value) => {
              charmClient.snoozeTransactions({
                snooze: isSnoozed,
                snoozeFor: value ? value.toJSDate() : null
              });
            }}
            onChange={(value) => {
              setSnoozedForDate(value);
            }}
            renderInput={(props) => <TextField fullWidth {...props} />}
          />
          )}
        </Box>
      </Box>
      {
        tasks.map((task: GnosisTask) => (
          <Card key={task.nonce} sx={{ my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
            <Box display='flex'>
              <Box px={3} height={rowHeight} display='flex' alignItems='center'>
                {task.transactions[0].nonce}
              </Box>
              <Box flexGrow={1}>
                {task.transactions.length > 1 && (
                  <Box height={rowHeight} display='flex' alignItems='center'>
                    <Alert color='info' icon={false} sx={{ py: 0, width: '100%' }}>
                      These transactions conflict as they use the same nonce. Executing one will automatically replace the other(s).
                    </Alert>
                  </Box>
                )}
                {task.transactions.map(transaction => (
                  <TransactionRow snoozedAddresses={snoozedAddresses} transaction={transaction} key={transaction.id} />
                ))}
              </Box>
            </Box>
          </Card>
        ))
      }
    </>
  );
}

export default function GnosisTasksSection () {

  const { data: safeData, mutate } = useMultiWalletSigs();
  const { error, mutate: mutateTasks, tasks } = useTasks();

  const gnosisSigner = useGnosisSigner();
  const [user] = useUser();
  const [isLoadingSafes, setIsLoadingSafes] = useState(false);

  async function importSafes () {
    if (gnosisSigner && user) {
      setIsLoadingSafes(true);
      try {
        await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.addresses
        });
        await mutate();
        await mutateTasks();
      }
      finally {
        setIsLoadingSafes(false);
      }
    }
  }
  const safesWithTasks = tasks?.gnosis;

  return (
    <>
      <Legend>Multisig</Legend>
      {!safesWithTasks && !error && <LoadingComponent height='200px' isLoading={true} />}
      {error && !safesWithTasks && (
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      )}
      {safesWithTasks && safesWithTasks.map(safe => (
        <SafeTasks
          key={safe.safeAddress}
          address={safe.safeAddress}
          safeName={safe.safeName}
          tasks={safe.tasks}
          safeUrl={safe.safeUrl}
          snoozedAddresses={safe.snoozedAddresses}
        />
      ))}
      {safeData?.length === 0 && (
        <GnosisConnectCard loading={!gnosisSigner || isLoadingSafes} onClick={importSafes} />
      )}
    </>
  );
}
