import type { LockConditions } from 'lib/tokenGates/interfaces';
import { getLockDetails } from 'lib/tokenGates/unlock/getLockDetails';

export async function updateTokenGateLockDetails<T extends LockConditions>(
  unlockTokenGates: T[],
  withMetaData?: boolean
): Promise<T[]> {
  const updatedUnlockProtocolGates = await Promise.all(
    unlockTokenGates.map(async (gate) => {
      const lock = await getLockDetails(
        { contract: gate.conditions.contract, chainId: gate.conditions.chainId },
        withMetaData
      );
      return { ...gate, conditions: lock };
    })
  );

  return updatedUnlockProtocolGates;
}
