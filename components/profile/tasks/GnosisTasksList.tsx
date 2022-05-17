import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Alert, Box, Button, Card, Chip, Collapse, Divider, Grid, IconButton, Menu, MenuItem, TextField, Typography } from '@mui/material';
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
import { User, UserGnosisSafeState } from '@prisma/client';
import Tooltip from '@mui/material/Tooltip';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import CancelIcon from '@mui/icons-material/Cancel';
import MessageIcon from '@mui/icons-material/Message';
import { GnosisConnectCard } from '../integrations/GnosisSafes';
import useTasks from './hooks/useTasks';

const rowHeight = 48;

const GridColumn = styled((props: any) => <Grid item xs {...props} />)`
  display: flex;
  align-items: center;
`;

type UserWithGnosisSafeState = User & {userGnosisSafeState: UserGnosisSafeState | null}

function TransactionRow (
  { firstNonce, isSnoozed, snoozedUsers, transaction }:
  { firstNonce: number, isSnoozed: boolean, snoozedUsers: UserWithGnosisSafeState[], transaction: GnosisTransactionPopulated }
) {
  const [expanded, setExpanded] = useState(false);
  const isReadyToExecute = transaction.confirmations?.length === transaction.threshold;
  const filteredSnoozedUsers: UserWithGnosisSafeState[] = [];
  const confirmedAddresses = transaction.confirmations.map(confirmation => confirmation.address);

  // Filter out the snoozed users that have already confirmed transaction
  snoozedUsers.forEach(snoozedUser => {
    if (!snoozedUser.addresses.some(address => confirmedAddresses.includes(address))) {
      filteredSnoozedUsers.push(snoozedUser);
    }
  });

  const isFirstTask = transaction.nonce === firstNonce;

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
          <Tooltip arrow placement='top' title={isSnoozed ? 'Transactions snoozed' : !isFirstTask ? `Transaction with nonce ${firstNonce} needs to be executed first` : ''}>
            <div>
              <Chip
                clickable={!!transaction.myAction}
                component='a'
                label={transaction.myAction || 'Waiting for others'}
                href={transaction.myActionUrl}
                target='_blank'
                color={transaction.myAction ? 'primary' : undefined}
                variant={transaction.myAction ? 'filled' : 'outlined'}
                disabled={isSnoozed || !isFirstTask}
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
                  <Box display='flex' gap={1} alignItems='center'>
                    {snoozedUser.userGnosisSafeState?.transactionsSnoozeMessage && (
                    <Tooltip arrow placement='top' title={snoozedUser.userGnosisSafeState.transactionsSnoozeMessage}>
                      <MessageIcon
                        fontSize='small'
                        color='secondary'
                        sx={{
                          width: 14
                        }}
                      />
                    </Tooltip>
                    )}
                    <Typography variant='subtitle1' color='secondary'>
                      for {DateTime.fromJSDate(new Date(snoozedUser.userGnosisSafeState?.transactionsSnoozedFor as Date))
                      .toRelative({ base: (DateTime.now()) })?.slice(3)}
                    </Typography>
                  </Box>
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
  { isSnoozed: boolean, snoozedUsers: UserWithGnosisSafeState[], address: string, safeName: string | null, safeUrl: string, tasks: GnosisTask[] }
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
                    firstNonce={tasks[0].transactions[0].nonce}
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snoozeMessage, setSnoozeMessage] = useState<null | string>(null);
  const [snoozedFor, setSnoozedFor] = useState<null | '1_day' | '3_days'>(null);
  const { mutate: mutateTasks } = useTasks();
  const isSnoozed = snoozedForDate !== null;
  const primaryPopupState = usePopupState({
    popupId: 'snooze-transactions',
    variant: 'popover'
  });
  const secondaryPopupState = usePopupState({
    popupId: 'snooze-transactions-message',
    variant: 'popover'
  });

  const primaryTriggerState = bindTrigger(primaryPopupState);
  const primaryMenuState = bindMenu(primaryPopupState);

  const secondaryTriggerState = bindTrigger(secondaryPopupState);
  const secondaryMenuState = bindMenu(secondaryPopupState);

  function resetState () {
    primaryMenuState.onClose();
    setShowDatePicker(false);
    setSnoozeMessage(null);
    setSnoozedFor(null);
    secondaryMenuState.onClose();
  }

  async function removeSnoozedForDate () {
    setSnoozedForDate(null);
    await charmClient.snoozeTransactions({
      snoozeFor: null,
      snoozeMessage: null
    });
    mutateTasks();
    resetState();
  }

  useEffect(() => {
    if (snoozedForDate) {
      const currentTimestamp = Date.now();
      const snoozedForTimestamp = snoozedForDate.toJSDate().getTime();
      // If the snoozed time has passed
      if (snoozedForTimestamp < currentTimestamp) {
        removeSnoozedForDate();
      }
    }
  }, [snoozedForDate]);

  const onClose = primaryMenuState.onClose;
  primaryMenuState.onClose = () => {
    setShowDatePicker(false);
    onClose();
  };

  async function setSnoozedDate () {
    if (snoozedFor) {
      let newSnoozedForDate = DateTime.fromMillis(Date.now());
      switch (snoozedFor) {
        case '1_day': {
          newSnoozedForDate = newSnoozedForDate.plus({ day: 1 });
          break;
        }
        case '3_days': {
          newSnoozedForDate = newSnoozedForDate.plus({ days: 3 });
          break;
        }
        default: {
          newSnoozedForDate = newSnoozedForDate.plus({ day: 1 });
        }
      }
      setSnoozedForDate(newSnoozedForDate);
      await charmClient.snoozeTransactions({
        snoozeFor: newSnoozedForDate.toJSDate(),
        snoozeMessage
      });
      mutateTasks();
      resetState();
    }
  }

  return (
    <Box sx={{ float: 'right' }}>
      <Button
        variant='outlined'
        startIcon={(
          <SnoozeIcon
            fontSize='small'
          />
        )}
        {...primaryTriggerState}
      >
        {isSnoozed ? `Snoozed for ${snoozedForDate.toRelative({ base: (DateTime.now()) })?.slice(3)}` : 'Snooze'}
      </Button>
      <Menu
        {...primaryMenuState}
      >
        <MenuItem
          {...secondaryTriggerState}
          onClick={(e) => {
            setSnoozedFor('1_day');
            secondaryTriggerState.onClick(e);
          }}
        >1 day
        </MenuItem>
        <MenuItem
          {...secondaryTriggerState}
          onClick={(e) => {
            setSnoozedFor('3_days');
            secondaryTriggerState.onClick(e);
          }}
          // setSnoozedDate('3_days');
        >3 days
        </MenuItem>
        {showDatePicker
          ? (
            <Box display='flex' gap={1}>
              <DateTimePicker
                minDate={DateTime.fromMillis(Date.now()).plus({ day: 1 })}
                value={DateTime.fromMillis(Date.now()).plus({ day: 1 })}
                onAccept={async (value) => {
                  if (value) {
                    setSnoozedForDate(value);
                    await charmClient.snoozeTransactions(
                      { snoozeFor: value.toJSDate(), snoozeMessage: null }
                    );
                    mutateTasks();
                    primaryMenuState.onClose();
                    setShowDatePicker(false);
                  }
                }}
                onChange={() => {}}
                renderInput={(props) => <TextField fullWidth {...props} />}
              />
              <IconButton
                color='error'
                onClick={() => {
                  setShowDatePicker(false);
                }}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )
          : (
            <MenuItem
              divider={isSnoozed}
              onClick={() => {
                setShowDatePicker(true);
              }}
            >Pick a date
            </MenuItem>
          )}
        {isSnoozed && (
        <MenuItem onClick={removeSnoozedForDate}>
          Unsnooze
        </MenuItem>
        )}
      </Menu>
      <Menu {...secondaryMenuState}>
        <Box display='flex' gap={1} px={1}>
          <TextField fullWidth placeholder='Snooze message' onChange={(e) => setSnoozeMessage(e.target.value)} value={snoozeMessage} />
          <Button onClick={setSnoozedDate}>Save
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}

export default function GnosisTasksSection () {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { error, mutate: mutateTasks, tasks } = useTasks();
  const [user] = useUser();
  const gnosisSigner = useGnosisSigner();

  const [snoozedForDate, setSnoozedForDate] = useState<null | DateTime>(
    (user?.userGnosisSafeState?.transactionsSnoozedFor ? DateTime.fromJSDate(new Date(user.userGnosisSafeState.transactionsSnoozedFor)) : null)
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
      <Legend>Multisig
        <SnoozeTransaction snoozedForDate={snoozedForDate} setSnoozedForDate={setSnoozedForDate} />
      </Legend>
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
