import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';

let tokenGateId = 0;

export function createMockTokenGate(gate: Partial<TokenGateWithRoles<'lit'>>): TokenGateWithRoles<'lit'> {
  return {
    createdAt: new Date(),
    // eslint-disable-next-line no-plusplus
    id: `${tokenGateId++}`,
    resourceId: {},
    spaceId: '',
    type: 'lit',
    tokenGateToRoles: [],
    conditions: {},
    ...gate
  };
}
