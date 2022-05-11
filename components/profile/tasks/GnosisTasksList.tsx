import { useState } from 'react';
import styled from '@emotion/styled';
import { DateTime } from 'luxon';
import { Alert, Box, Card, Chip, Collapse, Divider, Grid, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PeopleIcon from '@mui/icons-material/People';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import { shortenHex } from 'lib/utilities/strings';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { useUser } from 'hooks/useUser';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import { GnosisTask, GnosisTransactionPopulated } from 'lib/gnosis/gnosis.tasks';
import { GnosisConnectCard } from '../integrations/GnosisSafes';
import useTasks from './hooks/useTasks';

const rowHeight = 48;

const GridColumn = styled((props: any) => <Grid item xs {...props} />)`
  display: flex;
  align-items: center;
`;

function TransactionRow ({ transaction }: { transaction: GnosisTransactionPopulated }) {

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
          <Typography variant='caption' sx={{ fontWeight: isReadyToExecute ? 'bold' : '' }}>
            <PeopleIcon fontSize='small' /> {transaction.confirmations?.length || 0} out of {transaction.threshold}
          </Typography>
        </GridColumn>
        <GridColumn sx={{ justifyContent: 'flex-end' }}>
          <Chip
            clickable
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
        <Box py={1} pl={3}>
          {transaction.actions.map(action => (
            <Box py={1}>
              <Typography>
                Sending <strong>{action.friendlyValue}</strong> to {action.to}
              </Typography>
            </Box>
          ))}
        </Box>
        <Divider />
      </Collapse>
    </>
  );
}

function SafeTasks ({ address, safeName, safeUrl, tasks }: { address: string, safeName: string | null, safeUrl: string, tasks: GnosisTask[] }) {

  return (
    <>
      <Typography color='inherit'>
        Tasks from safe: <Link href={safeUrl} external target='_blank'>{safeName || shortenHex(address)} <OpenInNewIcon fontSize='small' /></Link>
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
                {task.transactions.map(transaction => (
                  <TransactionRow transaction={transaction} />
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

  const { data: walletData, mutate } = useMultiWalletSigs();

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
      }
      finally {
        setIsLoadingSafes(false);
      }
    }
  }
  const { error, tasks } = useTasks();
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
        />
      ))}
      {walletData?.length === 0 && (
        <GnosisConnectCard loading={!gnosisSigner || isLoadingSafes} onClick={importSafes} />
      )}
    </>
  );
}
