import { LocksmithService } from '@unlock-protocol/unlock-js';

export async function getLockMetadata(values: { chainId: number; contract: string }) {
  const { chainId, contract } = values;
  const lockSmith = new LocksmithService();
  const response = await lockSmith.lockMetadata(Number(chainId), contract);

  return response.data;
}
