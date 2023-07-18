import type { Signer } from 'ethers';
import log from 'loglevel';
import { useCallback, useState } from 'react';

import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';

import useMultiWalletSigs from './useMultiWalletSigs';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export default function useImportSafes() {
  const { data, mutate } = useMultiWalletSigs();
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const [isLoadingSafes, setIsLoadingSafes] = useState(false);

  const getWalletDetails = useCallback(
    (address: string) => {
      return data?.find((wallet) => wallet.address === address);
    },
    [data]
  );

  const importSafes = async (gnosisSigner: Signer | null) => {
    if (gnosisSigner && user) {
      setIsLoadingSafes(true);
      try {
        await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.wallets.map((w) => w.address),
          getWalletDetails
        });
        await mutate();
      } catch (e) {
        log.error('Error importing safes', e);
        showMessage('We could not import your safes', 'error');
      } finally {
        setIsLoadingSafes(false);
      }
    }
  };

  return { isLoadingSafes, importSafes };
}
