import type { Lock } from 'lib/tokenGates/interfaces';
import { getLockDetails } from 'lib/tokenGates/unlock/getLockDetails';

export async function updateLocksDetails<T extends { conditions: Pick<Lock, 'contract' | 'chainId'> }>(
  unlockTokenGates: T[]
): Promise<T[]> {
  const updatedUnlockProtocolGates = await Promise.all(
    unlockTokenGates.map(async (gate) => {
      const lock = await getLockDetails({ contract: gate.conditions.contract, chainId: gate.conditions.chainId }, true);
      return { ...gate, conditions: lock };
    })
  );

  return updatedUnlockProtocolGates;
}
