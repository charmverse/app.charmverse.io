
import type { Signer } from 'ethers';

import charmClient from 'charmClient';

import { getSafesForAddresses } from './gnosis';

interface ImportSafeProps {
  signer: Signer;
  addresses: string[];
  getWalletName?: (address: string) => string | null | undefined;
}

export async function importSafesFromWallet ({ signer, addresses, getWalletName }: ImportSafeProps) {

  const safes = await getSafesForAddresses(signer, addresses);

  const safesData = safes.map(safe => ({
    address: safe.address,
    owners: safe.owners,
    threshold: safe.threshold,
    chainId: safe.chainId,
    name: getWalletName?.(safe.address) // get existing name if user gave us one
  }));
  await charmClient.setMyGnosisSafes(safesData);
}
