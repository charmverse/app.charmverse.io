import log from 'loglevel';
import { useCallback, useState } from 'react';

import useGnosisSigner from 'hooks/useWeb3Signer';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';

import useMultiWalletSigs from './useMultiWalletSigs';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export default function useImportSafes() {
  const { data, mutate } = useMultiWalletSigs();
  const gnosisSigner = useGnosisSigner();
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const [isLoadingSafes, setIsLoadingSafes] = useState(false);

  const getWalletDetails = useCallback(
    (address: string) => {
      return data?.find((wallet) => wallet.address === address);
    },
    [data]
  );

  const importSafes = useCallback(async () => {
    if (gnosisSigner && user) {
      setIsLoadingSafes(true);
      try {
        const safesCount = await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.wallets.map((w) => w.address),
          getWalletDetails
        });

        if (!safesCount) {
          showMessage('You do not have any gnosis wallets', 'warning');
        }
        await mutate();
      } catch (e) {
        log.error('Error importing safes', e);

        showMessage('We could not import your safes', 'error');
      } finally {
        setIsLoadingSafes(false);
      }
    }
  }, [gnosisSigner, user, getWalletDetails]);

  return { isLoadingSafes, importSafes };
}
