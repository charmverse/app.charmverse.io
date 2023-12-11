import { LocksmithService } from '@unlock-protocol/unlock-js';

import type { GetLockPayload } from './getLockDetails';

export async function getLockMetadata(values: Pick<GetLockPayload, 'chainId' | 'contract'>) {
  const { chainId, contract } = values;
  const lockSmith = new LocksmithService();
  const response = await lockSmith.lockMetadata(Number(chainId), contract);

  return response.data;
}
