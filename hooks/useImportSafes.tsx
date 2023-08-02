import type { UserGnosisSafe } from '@charmverse/core/prisma';
import type { Signer } from 'ethers';
import log from 'loglevel';
import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import { getSafesForAddresses } from 'lib/gnosis/gnosis';

import useMultiWalletSigs from './useMultiWalletSigs';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export function useImportSafes() {
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

interface ImportSafeProps {
  signer: Signer;
  addresses: string[];
  getWalletDetails?: (address: string) => UserGnosisSafe | null | undefined;
}

export async function importSafesFromWallet({ signer, addresses, getWalletDetails }: ImportSafeProps) {
  const safes = await getSafesForAddresses(signer, addresses);

  const safesData = safes.map((safe) => ({
    address: safe.address,
    owners: safe.owners,
    threshold: safe.threshold,
    chainId: safe.chainId,
    name: getWalletDetails?.(safe.address)?.name ?? null, // get existing name if user gave us one
    isHidden: getWalletDetails?.(safe.address)?.isHidden ?? false
  }));

  await charmClient.gnosisSafe.setMyGnosisSafes(safesData);

  return safes.length;
}
