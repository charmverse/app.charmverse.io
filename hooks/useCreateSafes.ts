import { log } from '@charmverse/core/log';
import { isTruthy } from '@packages/lib/utils/types';
import type ISafe from '@safe-global/safe-core-sdk';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { getAddress } from 'viem';

import { useWeb3Account } from 'hooks/useWeb3Account';

export function useCreateSafes(safeAddresses: string[]) {
  const [safes, setSafes] = useState<ISafe[]>([]);
  const { account, signer } = useWeb3Account();

  async function loadSafes() {
    if (!signer) return;

    const Safe = (await import('@safe-global/safe-core-sdk')).default;
    const EthersAdapter = (await import('@safe-global/safe-ethers-lib')).default;

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    });

    const _safes = await Promise.all(
      safeAddresses.map((safeAddress) =>
        Safe.create({ ethAdapter, safeAddress: getAddress(safeAddress) }).catch((error) => {
          log.warn('Error retrieving safe', error.message);
        })
      )
    );

    setSafes(_safes.filter(isTruthy));
  }

  useEffect(() => {
    if (safeAddresses.length && account && signer) {
      loadSafes();
    }
  }, [account, safeAddresses.length, signer]);

  return safes;
}
