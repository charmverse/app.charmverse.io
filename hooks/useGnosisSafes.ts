import type { UserGnosisSafe } from '@charmverse/core/prisma-client';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { getAddress } from 'viem';

import charmClient from 'charmClient';
import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import { lowerCaseEqual } from 'lib/utils/strings';

import useMultiWalletSigs from './useMultiWalletSigs';
import { useUser } from './useUser';
import { useWeb3Account } from './useWeb3Account';

export function useGnosisSafes(chainIdToUse?: number) {
  const { user } = useUser();
  const { data: existingSafesData, mutate: refreshSafes } = useMultiWalletSigs();
  const { account, chainId } = useWeb3Account();
  const _chainId = chainIdToUse ?? chainId ?? 1;

  const safeApiClient = useMemo(() => {
    return getSafeApiClient({ chainId: _chainId });
  }, [_chainId]);

  const { data: safeInfos } = useSWR(
    account && _chainId ? `/connected-gnosis-safes/${account}/${_chainId}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () =>
      safeApiClient
        .getSafesByOwner(getAddress(account!))
        .then(async (response) =>
          Promise.all(response.safes.map((safeAddress) => safeApiClient.getSafeInfo(safeAddress)))
        )
  );

  useEffect(() => {
    // This allows auto-syncing of safes, so the user does not need to visit their account to setup their safes
    if (safeInfos && existingSafesData && user) {
      const safesToAdd: Parameters<(typeof charmClient)['gnosisSafe']['setMyGnosisSafes']>[0] = [];

      for (const foundSafe of safeInfos) {
        if (
          foundSafe.owners.some((owner) => lowerCaseEqual(owner, account as string)) &&
          !existingSafesData.some((_existingSafe) => lowerCaseEqual(_existingSafe.address, foundSafe.address))
        ) {
          safesToAdd.push({
            address: foundSafe.address,
            userId: user.id,
            chainId: _chainId,
            isHidden: false,
            owners: foundSafe.owners,
            threshold: foundSafe.nonce
          });
        }
      }

      if (safesToAdd.length) {
        charmClient.gnosisSafe.setMyGnosisSafes([...safesToAdd, ...existingSafesData]).then(() => refreshSafes());
      }
    }
  }, [safeInfos?.length, existingSafesData?.length, user, account, _chainId]);

  const safeDataRecord =
    existingSafesData?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
      if (!record[userGnosisSafe.address]) {
        record[userGnosisSafe.address] = userGnosisSafe;
      }
      return record;
    }, {}) ?? {};

  return safeDataRecord;
}
