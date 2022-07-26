import { Space, TokenGate, TokenGateToRole } from '@prisma/client';

export interface TokenGateWithRoles extends TokenGate {
  space: Space;
  tokenGateToRoles: TokenGateToRole[];
}
