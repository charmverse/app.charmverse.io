import type { Provider } from '@ethersproject/providers';

import { getSafeContract } from 'lib/gnosis/safe/getSafeContract';

export async function getSafeOwners({
  address,
  provider
}: {
  address: string;
  provider: Provider;
}): Promise<string[] | null> {
  try {
    const safeContract = getSafeContract({ providerOrSigner: provider, address });
    const owners: string[] = await safeContract.getOwners();

    return owners;
  } catch (e) {
    return null;
  }
}
