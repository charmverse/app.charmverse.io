import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';

let tokenGateId = 0;

export function createMockTokenGate(gate: Partial<TokenGateWithRoles>): TokenGateWithRoles {
  return {
    createdAt: new Date(),
    // eslint-disable-next-line no-plusplus
    id: `${tokenGateId++}`,
    conditions: {},
    resourceId: {},
    tokenGateToRoles: [],
    ...gate
  };
}
