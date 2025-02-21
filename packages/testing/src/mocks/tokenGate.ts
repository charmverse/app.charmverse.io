import type { TokenGateWithRoles } from '@root/lib/tokenGates/interfaces';

let tokenGateId = 0;

export function createMockTokenGate(gate: Partial<TokenGateWithRoles>): TokenGateWithRoles {
  return {
    createdAt: new Date(),
    // eslint-disable-next-line no-plusplus
    id: `${tokenGateId++}`,
    spaceId: '',
    tokenGateToRoles: [],
    conditions: {
      accessControlConditions: [],
      operator: 'OR'
    },
    ...gate
  };
}
