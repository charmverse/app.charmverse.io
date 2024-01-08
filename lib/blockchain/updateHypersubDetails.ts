import { getHypersubDetails } from 'lib/tokenGates/hypersub/getHypersubDetails';
import type { HypersubConditions } from 'lib/tokenGates/interfaces';

export async function updateTokenGateHypersubDetails<T extends HypersubConditions>(
  hypersubTokenGates: T[]
): Promise<T[]> {
  const updatedHypersubGates = await Promise.all(
    hypersubTokenGates.map(async (gate) => {
      const hypersub = await getHypersubDetails({
        contract: gate.conditions.contract,
        chainId: gate.conditions.chainId
      });
      return { ...gate, conditions: hypersub };
    })
  );

  return updatedHypersubGates;
}
