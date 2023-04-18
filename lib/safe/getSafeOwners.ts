import type { Provider } from '@ethersproject/providers';

import log from 'lib/log';
import { getSafeContract } from 'lib/safe/contracts';

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
    log.warn('[safe] Error while getting safe owners', e);

    return null;
  }
}
