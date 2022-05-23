import React, { useEffect, useRef, useState } from 'react';
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
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import { GnosisTask, GnosisTransactionPopulated } from 'lib/gnosis/gnosis.tasks';
import SnoozeIcon from '@mui/icons-material/Snooze';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import charmClient from 'charmClient';
import Tooltip from '@mui/material/Tooltip';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import { GnosisConnectCard } from '../integrations/components/GnosisSafes';
import useTasks from './hooks/useTasks';

const rowHeight = 48;

const GridColumn = styled((props: any) => <Grid item xs {...props} />)`
  display: flex;
  align-items: center;
`;

function TransactionRow (
  { firstNonce, isSnoozed, transaction }:
  { firstNonce: number, isSnoozed: boolean, transaction: GnosisTransactionPopulated }
) {
  const [expanded, setExpanded] = useState(false);
  const isReadyToExecute = transaction.confirmations?.length === transaction.threshold;
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
              {transaction.snoozedUsers.length !== 0 ? <Typography sx={{ mt: 2 }} color='secondary' gutterBottom variant='body2'>Snoozed</Typography> : null}
              {transaction.snoozedUsers.map(snoozedUser => (
                <Box py={1} display='flex' justifyContent='space-between'>
                  <UserDisplay avatarSize='small' user={snoozedUser} />
                  <Box display='flex' gap={1} alignItems='center'>
                    {snoozedUser.gnosisSafeState?.transactionsSnoozeMessage && (
                    <Tooltip arrow placement='top' title={snoozedUser.gnosisSafeState.transactionsSnoozeMessage}>
                      <EmailIcon
                        fontSize='small'
                        color='secondary'
                      />
                    </Tooltip>
                    )}
                    <Typography variant='subtitle1' color='secondary'>
                      for {DateTime.fromJSDate(new Date(snoozedUser.gnosisSafeState?.transactionsSnoozedFor as Date))
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
  { isSnoozed, address, safeName, safeUrl, tasks }:
  { isSnoozed: boolean, address: string, safeName: string | null, safeUrl: string, tasks: GnosisTask[] }
) {

  return (
    <>
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
                {task.transactions.map((transaction) => (
                  <TransactionRow
                    firstNonce={tasks[0].transactions[0].nonce}
                    isSnoozed={isSnoozed}
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

function SnoozeTransactions (
  { message, snoozedForDate, setSnoozedForDate }:
  { message: null | string, snoozedForDate: DateTime | null, setSnoozedForDate: React.Dispatch<React.SetStateAction<DateTime | null>> }
) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snoozeMessage, setSnoozeMessage] = useState(message);
  const [snoozedFor, setSnoozedFor] = useState<null | '1_day' | '3_days' | DateTime>(null);
  const { isValidating, mutate: mutateTasks } = useTasks();
  const isSnoozed = snoozedForDate !== null;
  const primaryPopupState = usePopupState({
    popupId: 'snooze-transactions',
    variant: 'popover'
  });
  const secondaryPopupState = usePopupState({
    popupId: 'snooze-transactions-message',
    variant: 'popover'
  });
  const dateTimePickerRef = useRef<HTMLDivElement>(null);

  const primaryTriggerState = bindTrigger(primaryPopupState);
  const primaryMenuState = bindMenu(primaryPopupState);

  const secondaryTriggerState = bindTrigger(secondaryPopupState);
  const secondaryMenuState = bindMenu(secondaryPopupState);
  const secondaryMenuStateOnClose = secondaryMenuState.onClose;

  secondaryMenuState.onClose = () => {
    setSnoozeMessage(null);
    secondaryMenuStateOnClose();
  };

  function closeMenus () {
    secondaryMenuState.onClose();
    primaryMenuState.onClose();
  }

  function resetState () {
    setShowDatePicker(false);
    setSnoozeMessage(null);
    setSnoozedFor(null);
  }

  async function removeSnoozedForDate () {
    resetState();
    await charmClient.updateGnosisSafeState({
      snoozeFor: null,
      snoozeMessage: null
    });
    setSnoozedForDate(null);
    mutateTasks();
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

  useEffect(() => {
    setSnoozeMessage(message);
  }, [message]);

  const onClose = primaryMenuState.onClose;
  primaryMenuState.onClose = () => {
    setShowDatePicker(false);
    onClose();
  };

  async function setSnoozedDate (_snoozeMessage: string | null) {
    resetState();
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
        if (snoozedFor instanceof DateTime) {
          newSnoozedForDate = snoozedFor;
        }
        else if (snoozedForDate instanceof DateTime) {
          newSnoozedForDate = snoozedForDate;
        }
      }
    }
    setSnoozedForDate(newSnoozedForDate);
    await charmClient.updateGnosisSafeState({
      snoozeFor: newSnoozedForDate.toJSDate(),
      snoozeMessage: _snoozeMessage
    });
    mutateTasks();
  }

  useEffect(() => {
    if (showDatePicker && dateTimePickerRef.current) {
      setTimeout(() => {
        if (dateTimePickerRef.current) {
          const button = dateTimePickerRef.current.querySelector<HTMLButtonElement>('button');
          if (button) {
            button.click();
          }
        }
      }, 500);
    }
  }, [showDatePicker]);

  return (
    <Box>
      <Button
        disabled={isValidating}
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
        sx={{
          '& .MuiPaper-root': {
            minWidth: showDatePicker ? 300 : 250
          }
        }}
      >
        {snoozedForDate && <Typography sx={{ pl: 2 }} variant='subtitle1' color='secondary'>{snoozedForDate.toRFC2822()}</Typography>}
        <MenuItem
          {...secondaryTriggerState}
          onClick={(e) => {
            setSnoozedFor('1_day');
            secondaryTriggerState.onClick(e);
          }}
        >Snooze for 1 day
        </MenuItem>
        <MenuItem
          {...secondaryTriggerState}
          onClick={(e) => {
            setSnoozedFor('3_days');
            secondaryTriggerState.onClick(e);
          }}
        >Snooze for 3 days
        </MenuItem>
        {showDatePicker
          ? (
            <Box display='flex' gap={1}>
              <DateTimePicker
                ref={dateTimePickerRef}
                minDate={DateTime.fromMillis(Date.now()).plus({ day: 1 })}
                value={DateTime.fromMillis(Date.now()).plus({ day: 1 })}
                onAccept={async (value) => {
                  if (value) {
                    if (dateTimePickerRef.current) {
                      secondaryTriggerState.onClick({ currentTarget: dateTimePickerRef.current } as any);
                      setSnoozedFor(value);
                    }
                  }
                }}
                onChange={() => {}}
                renderInput={(props) => (
                  <TextField
                    {...props}
                    inputProps={{
                      ...props.inputProps,
                      readOnly: true
                    }}
                    disabled
                    fullWidth
                  />
                )}
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
        <>
          <MenuItem onClick={() => {
            // Close the menu and then update the state after a bit of delay
            closeMenus();
            setTimeout(() => {
              removeSnoozedForDate();
            }, 500);
          }}
          >
            Unsnooze
          </MenuItem>
          <MenuItem onClick={(e) => {
            secondaryTriggerState.onClick(e);
          }}
          >
            Edit message
          </MenuItem>
        </>
        )}
      </Menu>
      <Menu {...secondaryMenuState} elevation={20}>
        <Box display='flex' gap={1} px={1}>
          <TextField
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                closeMenus();
                setTimeout(() => {
                  setSnoozedDate(snoozeMessage);
                }, 500);
              }
            }}
            autoFocus
            fullWidth
            placeholder='Snooze message'
            onChange={(e) => setSnoozeMessage(e.target.value)}
            value={snoozeMessage}
          />
          <Button onClick={() => {
            closeMenus();
            setTimeout(() => {
              setSnoozedDate(snoozeMessage);
            }, 500);
          }}
          >{isSnoozed ? 'Edit' : 'Save'}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}

export default function GnosisTasksSection () {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { error, mutate: mutateTasks, tasks } = useTasks();
  const gnosisSigner = useGnosisSigner();

  const taskUser = tasks?.user;
  const transactionsSnoozedFor = taskUser?.gnosisSafeState?.transactionsSnoozedFor;
  const transactionSnoozedDate = transactionsSnoozedFor ? DateTime.fromJSDate(new Date(transactionsSnoozedFor)) : null;

  const [snoozedForDate, setSnoozedForDate] = useState<null | DateTime>(
    transactionSnoozedDate
  );

  useEffect(() => {
    setSnoozedForDate(transactionSnoozedDate);
  }, [taskUser]);

  const isSnoozed = snoozedForDate !== null;

  const [isLoadingSafes, setIsLoadingSafes] = useState(false);

  async function importSafes () {
    if (gnosisSigner && taskUser) {
      setIsLoadingSafes(true);
      try {
        await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: taskUser.addresses
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
      <Legend>
        <Box display='flex' justifyContent='flex-end'>
          <SnoozeTransactions
            message={taskUser?.gnosisSafeState?.transactionsSnoozeMessage ?? null}
            snoozedForDate={snoozedForDate}
            setSnoozedForDate={setSnoozedForDate}
          />
        </Box>
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
        />
      ))}
      {safeData?.length === 0 && (
        <GnosisConnectCard loading={!gnosisSigner || isLoadingSafes} onClick={importSafes} />
      )}
    </>
  );
}
