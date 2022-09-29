import EmailIcon from '@mui/icons-material/Email';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleIcon from '@mui/icons-material/People';
import { Alert, Box, Card, Chip, Collapse, Divider, Grid, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay, { AnonUserDisplay } from 'components/common/UserDisplay';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import type { GnosisSafeTasks, GnosisTask, GnosisTransactionPopulated } from 'lib/gnosis/gnosis.tasks';
import { shortenHex } from 'lib/utilities/strings';
import { DateTime } from 'luxon';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { GnosisConnectCard } from '../integrations/components/GnosisSafes';
import useTasksState from './hooks/useTasksState';

const rowHeight = 48;

function TransactionRow (
  { firstNonce, isSnoozed, transaction }:
  { firstNonce: number, isSnoozed: boolean, transaction: GnosisTransactionPopulated }
) {
  const [expanded, setExpanded] = useState(false);
  const isReadyToExecute = transaction.confirmations?.length === transaction.threshold;
  const isFirstTask = transaction.nonce === firstNonce;
  return (
    <>
      <Grid justifyContent='space-between' alignItems='center' container key={transaction.id} sx={{ width: '100%', height: rowHeight }} onClick={() => setExpanded(!expanded)}>
        <Grid
          item
          xs={4}
          sx={{
            fontSize: { xs: 14, sm: 'inherit' }
          }}
        >
          {transaction.description}
        </Grid>
        <Grid
          item
          xs={2}
          sx={{
            display: { xs: 'none', sm: 'inherit' }
          }}
        >
          {DateTime.fromISO(transaction.date).toRelative({ base: DateTime.now() })}
        </Grid>
        <Grid
          item
          xs={2}
          sx={{
            display: { xs: 'none', sm: 'inherit' }
          }}
        >
          <Typography variant='caption' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: isReadyToExecute ? 'bold' : '' }}>
            <PeopleIcon color='secondary' fontSize='small' /> {transaction.confirmations?.length || 0} out of {transaction.threshold}
          </Typography>
        </Grid>
        <Grid
          item
          xs={3}
        >
          <Box
            justifySelf='flex-end'
            display='flex'
            sx={{
              width: '100%',
              justifyContent: 'right'
            }}
          >
            <Box justifySelf='flex-end' gap={1} display='flex' alignItems='center'>
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
              <Box sx={{ mr: 2, display: 'flex', justifyContent: 'flex-end' }}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <Collapse in={expanded}>
        <Divider />
        <Box py={1} pl={1} sx={{ bgcolor: 'background.light' }}>
          <Grid container spacing={1}>
            <Grid item xs={5}>
              {transaction.actions.map(action => (
                <Box py={1} key={action.to.address}>
                  <Typography
                    gutterBottom
                  >
                    Sending <strong>{action.friendlyValue}</strong> to:
                  </Typography>
                  {action.to.user ? (
                    <UserDisplay
                      sx={{
                        '.MuiTypography-root': {
                          fontSize: {
                            xs: 14,
                            sm: 'inherit'
                          }
                        }
                      }}
                      avatarSize='small'
                      user={action.to.user}
                    />
                  ) : (
                    <AnonUserDisplay
                      avatarSize='small'
                      sx={{
                        '.MuiTypography-root': {
                          fontSize: {
                            xs: 14,
                            sm: 'inherit'
                          }
                        }
                      }}
                      address={shortenHex(action.to.address)}
                    />
                  )}
                </Box>
              ))}
            </Grid>
            <Grid item xs={1}>
              <Divider orientation='vertical' />
            </Grid>
            <Grid item xs={5} pr={1}>
              <Typography color='secondary' gutterBottom variant='body2'>Confirmations</Typography>
              {transaction.confirmations.map(confirmation => (
                <Box py={1} key={confirmation.address}>
                  {confirmation.user ? (
                    <UserDisplay
                      sx={{
                        '.MuiTypography-root': {
                          fontSize: {
                            xs: 14,
                            sm: 'inherit'
                          }
                        }
                      }}
                      avatarSize='small'
                      user={confirmation.user}
                    />
                  ) : (
                    <AnonUserDisplay
                      sx={{
                        '.MuiTypography-root': {
                          fontSize: {
                            xs: 14,
                            sm: 'inherit'
                          }
                        }
                      }}
                      avatarSize='small'
                      address={shortenHex(confirmation.address)}
                    />
                  )}
                </Box>
              ))}
              {transaction.snoozedUsers.length !== 0 ? <Typography sx={{ mt: 2 }} color='secondary' gutterBottom variant='body2'>Snoozed</Typography> : null}
              {transaction.snoozedUsers.map(snoozedUser => (
                <Box key={snoozedUser.id} py={1} display='flex' justifyContent='space-between'>
                  <UserDisplay avatarSize='small' user={snoozedUser} />
                  <Box display='flex' gap={1} alignItems='center'>
                    {snoozedUser.notificationState?.snoozeMessage && (
                      <Tooltip arrow placement='top' title={snoozedUser.notificationState.snoozeMessage}>
                        <EmailIcon
                          fontSize='small'
                          color='secondary'
                        />
                      </Tooltip>
                    )}
                    <Typography variant='subtitle1' color='secondary'>
                      for {DateTime.fromJSDate(new Date(snoozedUser.notificationState?.snoozedUntil as Date))
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
        variant='body2'
      >
        <strong>Gnosis Safe:</strong>
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
              <Box
                px={2}
                sx={{
                  px: { xs: 1 },
                  fontWeight: 'bold',
                  fontSize: {
                    xs: '0.85rem',
                    sm: 'inherit'
                  }
                }}
                height={rowHeight}
                display='flex'
                alignItems='center'
              >
                {task.transactions[0].nonce}
              </Box>
              <Box flexGrow={1}>
                {task.transactions.length > 1 && (
                  <Box my={{ sm: 0, xs: 1 }} height={rowHeight} display='flex' alignItems='center'>
                    <Alert color='info' icon={false} sx={{ py: 0, width: '100%', fontSize: { sm: '14px', xs: '12px' } }}>
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

interface GnosisTasksSectionProps {
  tasks: GnosisSafeTasks[] | undefined;
  error: any;
  mutateTasks: KeyedMutator<GnosisSafeTasks[]>;
}

export default function GnosisTasksSection ({ error, mutateTasks, tasks }: GnosisTasksSectionProps) {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { snoozedForDate } = useTasksState();
  const { user } = useUser();
  const gnosisSigner = useGnosisSigner();

  const isSnoozed = snoozedForDate !== null;

  const [isLoadingSafes, setIsLoadingSafes] = useState(false);
  const { showMessage } = useSnackbar();

  async function importSafes () {
    if (gnosisSigner && user) {
      setIsLoadingSafes(true);
      try {
        await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.addresses
        });
        const safes = await mutate();
        await mutateTasks();
        if (!safes || safes.length === 0) {
          showMessage('You don\'t have any gnosis safes connected to your wallet');
        }
        else {
          showMessage(`Successfully connected ${safes.length} safes`, 'success');
        }
      }
      finally {
        setIsLoadingSafes(false);
      }
    }
    else {
      alert('Please connect your Metamask wallet');
    }
  }

  if (!tasks) {
    if (error) {
      return (
        <Box>
          <Alert severity='error'>
            There was an error. Please try again later!
          </Alert>
        </Box>
      );
    }
    else {
      return <LoadingComponent height='200px' isLoading={true} />;
    }
  }

  return (
    <>
      {tasks.map(safe => (
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
        <GnosisConnectCard loading={isLoadingSafes} onClick={importSafes} />
      )}
    </>
  );
}
