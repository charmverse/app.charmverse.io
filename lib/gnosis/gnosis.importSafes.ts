import type { UserGnosisSafe } from '@charmverse/core/dist/cjs/prisma';
import type { Signer } from 'ethers';

import charmClient from 'charmClient';

import { getSafesForAddresses } from './gnosis';

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

  await charmClient.setMyGnosisSafes(safesData);

  return safes.length;
}
