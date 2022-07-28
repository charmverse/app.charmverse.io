import { Role, Space, TokenGate, TokenGateToRole } from '@prisma/client';
import { AuthSig } from 'lit-js-sdk';

export interface TokenGateWithRoles extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & {role: Role})[];
}

export interface TokenGateVerificationAttempt {
  userId: string;
  authSig: AuthSig;
  spaceIdOrDomain: string;
}

export interface TokenGateJwt {
  signedToken: string;
  tokenGate: TokenGateWithRoles;
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

/**
 * Used for passing lit JWTs and gaining membership to a space
 */
export interface TokenGateApplication {
  userId: string;
  spaceId: string;
  tokens: TokenGateJwt[];
}

export interface TokenGateApplicationResult {
  userId: string;
  space: Space;
  roles: Role[];
}
