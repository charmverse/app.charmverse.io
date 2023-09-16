import { log } from '@charmverse/core/log';
import Safe from '@safe-global/safe-core-sdk';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { isTruthy } from 'lib/utilities/types';

export default function useSafes(safeAddresses: string[]) {
  const [safes, setSafes] = useState<Safe[]>([]);
  const { account, signer } = useWeb3AuthSig();

  async function loadSafes() {
    if (!signer) return;

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    });

    const _safes = await Promise.all(
      safeAddresses.map((safeAddress) =>
        Safe.create({ ethAdapter, safeAddress }).catch((error) => {
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
  }, [account, safeAddresses.join(), signer]);

  return safes;
}
