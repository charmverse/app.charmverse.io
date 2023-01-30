import Safe from '@safe-global/safe-core-sdk';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import log from 'lib/log';
import { isTruthy } from 'lib/utilities/types';

export default function useSafes(safeAddresses: string[]) {
  const [safes, setSafes] = useState<Safe[]>([]);
  const { account, library } = useWeb3AuthSig();

  async function loadSafes() {
    const signer = library.getSigner(account);
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
    return _safes.filter(isTruthy);
  }

  useEffect(() => {
    if (safeAddresses.length && account) {
      loadSafes().then(setSafes);
    }
  }, [safeAddresses.join(), account]);

  return safes;
}
