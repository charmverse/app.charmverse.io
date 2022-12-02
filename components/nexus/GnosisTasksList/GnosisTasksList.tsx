import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import LoadingComponent from 'components/common/LoadingComponent';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';

import { GnosisConnectCard } from '../../integrations/components/GnosisSafes';
import useTasksState from '../hooks/useTasksState';

import { SafeTasks } from './GnosisTasksTable';

interface GnosisTasksSectionProps {
  tasks: GnosisSafeTasks[] | undefined;
  error: any;
  mutateTasks: KeyedMutator<GnosisSafeTasks[]>;
}

export function GnosisTasksList({ error, mutateTasks, tasks }: GnosisTasksSectionProps) {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { snoozedForDate } = useTasksState();
  const { user } = useUser();
  const gnosisSigner = useGnosisSigner();
  const isSnoozed = snoozedForDate !== null;

  const isLoadingSafeTasks = !safeData || !tasks;

  // Used when we're loading the safes from Gnosis API
  const [isRefreshingSafes, setIsRefreshingSafes] = useState(false);

  const { showMessage } = useSnackbar();

  async function importSafes() {
    if (gnosisSigner && user) {
      setIsRefreshingSafes(true);
      try {
        await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.wallets.map((wallet) => wallet.address)
        });
        const safes = await mutate();
        await mutateTasks();
        if (!safes || safes.length === 0) {
          showMessage("You don't have any gnosis safes connected to your wallet");
        } else {
          showMessage(`Successfully connected ${safes.length} safes`, 'success');
        }
      } finally {
        setIsRefreshingSafes(false);
      }
    }
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error'>There was an error. Please try again later!</Alert>
      </Box>
    );
  } else if (isLoadingSafeTasks) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  return (
    <>
      {safeData.length === 0 && (
        <GnosisConnectCard connectable={!!gnosisSigner} loading={isRefreshingSafes} onClick={importSafes} />
      )}
      {safeData.map((safe) => {
        const safeTasks = tasks
          .filter((taskGroup) => taskGroup.safeAddress === safe.address)
          .map((taskGroup) => taskGroup.tasks)
          .flat();
        return <SafeTasks key={safe.address} isSnoozed={isSnoozed} safe={safe} tasks={safeTasks} />;
      })}
    </>
  );
}
