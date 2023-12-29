import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { sortByDate } from 'lib/utilities/dates';

import { updateTokenGateLitDetails } from './updateLitDetails';
import { updateTokenGateLockDetails } from './updateLocksDetails';

export async function updateTokenGatesDetails(tokenGates: TokenGateWithRoles[]): Promise<TokenGateWithRoles[]> {
  const { lit, unlock } = tokenGates.reduce<{
    lit: TokenGateWithRoles<'lit'>[];
    unlock: TokenGateWithRoles<'unlock'>[];
  }>(
    (acc, gate) => {
      if (gate.type === 'unlock') {
        acc.unlock = [...acc.unlock, gate];
      } else if (gate.type === 'lit') {
        acc.lit = [...acc.lit, gate];
      }
      return acc;
    },
    { lit: [], unlock: [] }
  );
  // Add identifiable names to token gates
  const [updatedUnlockProtocolGates, updatedTokenGates] = await Promise.all([
    updateTokenGateLockDetails(unlock),
    updateTokenGateLitDetails(lit)
  ]);

  const sortedTokenGates = [...updatedUnlockProtocolGates, ...updatedTokenGates].sort(sortByDate);

  return sortedTokenGates;
}
