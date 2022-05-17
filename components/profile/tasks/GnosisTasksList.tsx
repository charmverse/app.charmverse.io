import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Alert, Box, Card, Chip, Collapse, Divider, Grid, IconButton, MenuItem, Select, TextField, Typography } from '@mui/material';
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
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import charmClient from 'charmClient';
import { User } from '@prisma/client';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { GnosisConnectCard } from '../integrations/GnosisSafes';
import useTasks from './hooks/useTasks';

const rowHeight = 48;

const GridColumn = styled((props: any) => <Grid item xs {...props} />)`
  display: flex;
  align-items: center;
`;

function TransactionRow (
  { isSnoozed, snoozedUsers, transaction }:
  { isSnoozed: boolean, snoozedUsers: User[], transaction: GnosisTransactionPopulated }
) {
  const [expanded, setExpanded] = useState(false);
  const isReadyToExecute = transaction.confirmations?.length === transaction.threshold;
  const filteredSnoozedUsers: User[] = [];
  const confirmedAddresses = transaction.confirmations.map(confirmation => confirmation.address);

  // Filter out the snoozed users that have already confirmed transaction
  snoozedUsers.forEach(snoozedUser => {
    if (!snoozedUser.addresses.some(address => confirmedAddresses.includes(address))) {
      filteredSnoozedUsers.push(snoozedUser);
    }
  });

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
          <Tooltip arrow placement='top' title={isSnoozed ? 'Transactions snoozed' : ''}>
            <div>
              <Chip
                clickable={!!transaction.myAction}
                component='a'
                label={transaction.myAction || 'Waiting for others'}
                href={transaction.myActionUrl}
                target='_blank'
                color={transaction.myAction ? 'primary' : undefined}
                variant={transaction.myAction ? 'filled' : 'outlined'}
                disabled={isSnoozed}
              />
            </div>
          </Tooltip>
        </GridColumn>
        <GridColumn sx={{ flexGrow: '0 !important' }}>
          <Box sx={{ width: 60, display: 'flex', justifyContent: 'center' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </GridColumn>
      </Grid>
      <Collapse in={expanded}>
        <Divider />
        <Box py={1} pl={4} pr={1} sx={{ bgcolor: 'background.light' }}>
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
            <Grid item xs={5} pr={1}>
              <Typography color='secondary' gutterBottom variant='body2'>Confirmations</Typography>
              {transaction.confirmations.map(confirmation => (
                <Box py={1}>
                  {confirmation.user ? <UserDisplay avatarSize='small' user={confirmation.user} /> : <AnonUserDisplay avatarSize='small' address={confirmation.address} />}
                </Box>
              ))}
              {filteredSnoozedUsers.length !== 0 ? <Typography sx={{ mt: 2 }} color='secondary' gutterBottom variant='body2'>Snoozed</Typography> : null}
              {filteredSnoozedUsers.map(snoozedUser => (
                <Box py={1} display='flex' justifyContent='space-between'>
                  <UserDisplay avatarSize='small' user={snoozedUser} />
                  <Typography variant='subtitle1' color='secondary'>
                    for {DateTime.fromJSDate(new Date(snoozedUser.transactionsSnoozedFor as Date)).toRelative({ base: (DateTime.now()) })?.slice(3)}
                  </Typography>
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
  { isSnoozed, snoozedUsers, address, safeName, safeUrl, tasks }:
  { isSnoozed: boolean, snoozedUsers: User[], address: string, safeName: string | null, safeUrl: string, tasks: GnosisTask[] }
) {

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
      </Box>
      {
        tasks.map((task: GnosisTask) => (
          <Card key={task.nonce} sx={{ my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
            <Box display='flex'>
              <Box px={3} height={rowHeight} display='flex' alignItems='center' gap={1}>
                <Typography>
                  {task.transactions[0].nonce}
                </Typography>
              </Box>
              <Box flexGrow={1}>
                {task.transactions.length > 1 && (
                  <Box height={rowHeight} display='flex' alignItems='center'>
                    <Alert color='info' icon={false} sx={{ py: 0, width: '100%' }}>
                      These transactions conflict as they use the same nonce. Executing one will automatically replace the other(s).
                    </Alert>
                  </Box>
                )}
                {task.transactions.map((transaction) => (
                  <TransactionRow
                    isSnoozed={isSnoozed}
                    snoozedUsers={snoozedUsers}
                    transaction={transaction}
                    key={transaction.id}
                  />
                ))}
              </Box>
            </Box>
          </Card>
        ))
      }
    </>
  );
}

function SnoozeTransaction (
  { snoozedForDate, setSnoozedForDate }:
  { snoozedForDate: DateTime | null, setSnoozedForDate: React.Dispatch<React.SetStateAction<DateTime | null>> }
) {
  const [isEditingSnooze, setIsEditingSnooze] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isSnoozed = snoozedForDate !== null;

  const SnoozeEditor = (
    <>
      <Typography variant='subtitle1' color='secondary'>
        Snooze for
      </Typography>
      <Box display='flex' gap={0.5}>
        {showDatePicker
          ? (
            <DateTimePicker
              value={DateTime.fromMillis(Date.now())}
              onAccept={async (value) => {
                setIsEditingSnooze(false);
                setShowDatePicker(false);
                setSnoozedForDate(value);
                await charmClient.snoozeTransactions(value ? value.toJSDate() : null);
              }}
              onChange={() => {}}
              renderInput={(props) => <TextField fullWidth {...props} />}
            />
          )
          : (
            <Select
              size='small'
              value='1_hr'
              variant='outlined'
              onChange={async (event) => {
                setIsEditingSnooze(false);
                let newSnoozedForDate = DateTime.fromMillis(Date.now());
                const eventValue = event.target.value as '1_hr' | '6_hrs' | '12_hrs' | '1_day' | '3_days' | '1_week' | '1_month' | 'custom';
                if (eventValue === 'custom') {
                  setShowDatePicker(true);
                }
                else {
                  switch (eventValue) {
                    case '1_hr': {
                      newSnoozedForDate = newSnoozedForDate.plus({ hour: 1 });
                      break;
                    }
                    case '6_hrs': {
                      newSnoozedForDate = newSnoozedForDate.plus({ hours: 6 });
                      break;
                    }
                    case '12_hrs': {
                      newSnoozedForDate = newSnoozedForDate.plus({ hours: 12 });
                      break;
                    }
                    case '1_day': {
                      newSnoozedForDate = newSnoozedForDate.plus({ day: 1 });
                      break;
                    }
                    case '3_days': {
                      newSnoozedForDate = newSnoozedForDate.plus({ days: 3 });
                      break;
                    }
                    case '1_week': {
                      newSnoozedForDate = newSnoozedForDate.plus({ weeks: 1 });
                      break;
                    }
                    case '1_month': {
                      newSnoozedForDate = newSnoozedForDate.plus({ month: 1 });
                      break;
                    }
                    default: {
                      newSnoozedForDate = newSnoozedForDate.plus({ day: 1 });
                    }
                  }
                  setSnoozedForDate(newSnoozedForDate);
                  await charmClient.snoozeTransactions(newSnoozedForDate.toJSDate());
                }
                // mutateTasks();
              }}
            >
              <MenuItem value='1_hr'>1 hr</MenuItem>
              <MenuItem value='6_hrs'>6 hrs</MenuItem>
              <MenuItem value='12_hrs'>12 hrs</MenuItem>
              <MenuItem value='1_day'>1 day</MenuItem>
              <MenuItem value='3_days'>3 days</MenuItem>
              <MenuItem value='1_week'>1 week</MenuItem>
              <MenuItem value='1_month'>1 month</MenuItem>
              <MenuItem value='custom'>Custom</MenuItem>
            </Select>
          )}
        <IconButton
          color='error'
          size='small'
          onClick={() => {
            setIsEditingSnooze(false);
            setShowDatePicker(false);
          }}
        >
          <CancelIcon />
        </IconButton>
      </Box>
    </>
  );

  function render () {
    if (!isSnoozed) {
      if (isEditingSnooze || showDatePicker) {
        return SnoozeEditor;
      }
      return (
        <Tooltip arrow placement='top' title='Snooze'>
          <IconButton
            size='small'
            onClick={async () => {
              setIsEditingSnooze(true);
              setShowDatePicker(false);
            }}
          >
            <SnoozeIcon
              fontSize='small'
              color='secondary'
            />
          </IconButton>
        </Tooltip>
      );
    }
    else {
      if (isEditingSnooze || showDatePicker) {
        return SnoozeEditor;
      }
      return (
        <>
          <Tooltip arrow placement='top' title={snoozedForDate.toRFC2822()}>
            <Typography variant='subtitle1'>
              Snoozed for { snoozedForDate.toRelative({ base: (DateTime.now()) })?.slice(3) }
            </Typography>
          </Tooltip>
          <div>
            <Tooltip arrow placement='top' title='Edit date'>
              <IconButton
                size='small'
                onClick={async () => {
                  setIsEditingSnooze(true);
                  setShowDatePicker(false);
                }}
              >
                <EditIcon
                  fontSize='small'
                  color='primary'
                />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='top' title='Un-Snooze'>
              <IconButton
                size='small'
                onClick={async () => {
                  setSnoozedForDate(null);
                  await charmClient.snoozeTransactions(null);
                }}
              >
                <SnoozeIcon
                  fontSize='small'
                  color='error'
                />
              </IconButton>
            </Tooltip>
          </div>
        </>
      );
    }
  }

  return (
    <Box display='flex' gap={1} alignItems='center'>
      {render()}
    </Box>
  );
}

export default function GnosisTasksSection () {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { error, mutate: mutateTasks, tasks } = useTasks();
  const [user] = useUser();
  const gnosisSigner = useGnosisSigner();

  const [snoozedForDate, setSnoozedForDate] = useState<null | DateTime>(
    (user?.transactionsSnoozedFor ? DateTime.fromJSDate(new Date(user?.transactionsSnoozedFor)) : null)
  );
  const isSnoozed = snoozedForDate !== null;

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
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Legend>Multisig</Legend>
        <SnoozeTransaction snoozedForDate={snoozedForDate} setSnoozedForDate={setSnoozedForDate} />
      </Box>
      {!safesWithTasks && !error && <LoadingComponent height='200px' isLoading={true} />}
      {error && !safesWithTasks && (
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      )}
      {safesWithTasks && safesWithTasks.map(safe => (
        <SafeTasks
          isSnoozed={isSnoozed}
          key={safe.safeAddress}
          address={safe.safeAddress}
          safeName={safe.safeName}
          tasks={safe.tasks}
          safeUrl={safe.safeUrl}
          snoozedUsers={safe.snoozedUsers}
        />
      ))}
      {safeData?.length === 0 && (
        <GnosisConnectCard loading={!gnosisSigner || isLoadingSafes} onClick={importSafes} />
      )}
    </>
  );
}
