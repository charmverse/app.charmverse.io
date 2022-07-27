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
  authSig: AuthSig;
  spaceIdOrDomain: string;
}

export interface TokenGateJwt {
  signedToken: string;
  tokenGateId: string;
}

/**
 * @gateTokens List of Lit-generated tokens we can verify when joining a space
 */
export interface TokenGateVerificationResult {
  userId: string;
  space: Space;
  walletAddress: string;
  canJoinSpace: boolean;
  gateTokens: TokenGateJwt[]
  roles: Role[]
}
