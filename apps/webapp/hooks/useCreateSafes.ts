import { log } from '@charmverse/core/log';
import { isTruthy } from '@packages/utils/types';
import Safe from '@safe-global/protocol-kit';
import type ISafe from '@safe-global/protocol-kit';
import { useEffect, useState } from 'react';
import { getAddress } from 'viem';

import { useWeb3Account } from 'hooks/useWeb3Account';

export function useCreateSafes(safeAddresses: string[]) {
  const [safes, setSafes] = useState<ISafe[]>([]);
  const { account } = useWeb3Account();

  async function loadSafes() {
    const _safes = await Promise.all(
      safeAddresses.map((safeAddress) =>
        Safe.init({
          provider: window.ethereum,
          signer: account || undefined,
          safeAddress: getAddress(safeAddress)
        }).catch((error) => {
          log.warn('Error retrieving safe', error.message);
        })
      )
    );

    setSafes(_safes.filter(isTruthy));
  }

  useEffect(() => {
    if (safeAddresses.length && account) {
      loadSafes();
    }
  }, [account, safeAddresses.length]);

  return safes;
}
