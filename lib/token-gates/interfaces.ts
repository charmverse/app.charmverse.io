import { Role, Space, TokenGate, TokenGateToRole } from '@prisma/client';
import { AuthSig } from 'lit-js-sdk';

export interface TokenGateWithRoleData extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & {role: Role})[];
}

export interface TokenGateWithRoles extends TokenGate {
  space: Space;
  tokenGateToRoles: TokenGateToRole[];
}

export interface TokenGateVerificationAttempt {
  userId: string;
  chainId: number;
  authSig: AuthSig;
  spaceIdOrDomain: string;
}

export interface TokenGateVerificationResult {
  userId: string;
  spaceId: string;
  walletAddress: string;
  chainId: number;
  canJoinSpace: boolean;
  roles: Role[]
}
