import EmailIcon from '@mui/icons-material/Email';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleIcon from '@mui/icons-material/People';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { UserGnosisSafe } from '@prisma/client';
import { DateTime } from 'luxon';
import { Fragment, useState } from 'react';
import type { KeyedMutator } from 'swr';

import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay, { AnonUserDisplay } from 'components/common/UserDisplay';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import type { GnosisSafeTasks, GnosisTask, GnosisTransactionPopulated } from 'lib/gnosis/gnosis.tasks';
import { getGnosisSafeUrl } from 'lib/gnosis/utils';
import { shortenHex } from 'lib/utilities/strings';

import { GnosisConnectCard } from '../../integrations/components/GnosisSafes';
import { EmptyTaskState } from '../components/EmptyTaskState';
import Table from '../components/NexusTable';
import useTasksState from '../hooks/useTasksState';

import { SafeTasks } from './GnosisTasksTable';

interface GnosisTasksSectionProps {
  tasks: GnosisSafeTasks[] | undefined;
  error: any;
  mutateTasks: KeyedMutator<GnosisSafeTasks[]>;
}

export function GnosisTasksList ({ error, mutateTasks, tasks }: GnosisTasksSectionProps) {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { snoozedForDate } = useTasksState();
  const { user } = useUser();
  const gnosisSigner = useGnosisSigner();
  const isSnoozed = snoozedForDate !== null;

  const isLoadingSafeTasks = !safeData || !tasks;

  // Used when we're loading the safes from Gnosis API
  const [isRefreshingSafes, setIsRefreshingSafes] = useState(false);

  const { showMessage } = useSnackbar();

  async function importSafes () {
    if (gnosisSigner && user) {
      setIsRefreshingSafes(true);
      try {
        await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.wallets.map(wallet => wallet.address)
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
        setIsRefreshingSafes(false);
      }
    }
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      </Box>
    );
  }
  else if (isLoadingSafeTasks) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  return (
    <>
      {gnosisSigner && user && (
        <GnosisConnectCard loading={isRefreshingSafes} onClick={importSafes} />
      )}
      {safeData?.map(safe => {
        const safeTasks = tasks.filter(taskGroup => taskGroup.safeAddress === safe.address).map(taskGroup => taskGroup.tasks).flat();
        return (
          <SafeTasks
            key={safe.address}
            isSnoozed={isSnoozed}
            safe={safe}
            tasks={safeTasks}
          />
        );

      })}

    </>
  );
}
