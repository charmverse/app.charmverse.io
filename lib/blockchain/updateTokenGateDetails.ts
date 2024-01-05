import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { sortByDate } from 'lib/utilities/dates';

import { updateTokenGateHypersubDetails } from './updateHypersubDetails';
import { updateTokenGateLitDetails } from './updateLitDetails';
import { updateTokenGateLockDetails } from './updateLocksDetails';

export async function updateTokenGatesDetails(tokenGates: TokenGateWithRoles[]): Promise<TokenGateWithRoles[]> {
  const { lit, unlock, hypersub } = tokenGates.reduce<{
    lit: TokenGateWithRoles<'lit'>[];
    unlock: TokenGateWithRoles<'unlock'>[];
    hypersub: TokenGateWithRoles<'hypersub'>[];
  }>(
    (acc, gate) => {
      if (gate.type === 'unlock') {
        acc.unlock = [...acc.unlock, gate];
      } else if (gate.type === 'hypersub') {
        acc.hypersub = [...acc.hypersub, gate];
      } else if (gate.type === 'lit') {
        acc.lit = [...acc.lit, gate];
      }
      return acc;
    },
    { lit: [], unlock: [], hypersub: [] }
  );
  // Add identifiable names to token gates
  const [updatedUnlockProtocolGates, updatedTokenGates, updatedHypersubGates] = await Promise.all([
    updateTokenGateLockDetails(unlock),
    updateTokenGateLitDetails(lit),
    updateTokenGateHypersubDetails(hypersub)
  ]);

  const sortedTokenGates = [...updatedUnlockProtocolGates, ...updatedTokenGates, ...updatedHypersubGates].sort(
    sortByDate
  );

  return sortedTokenGates;
}
