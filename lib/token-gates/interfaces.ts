import { Role, Space, TokenGate, TokenGateToRole } from '@prisma/client';
import { AuthSig } from 'lit-js-sdk';

export interface TokenGateWithRoles extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & {role: Role})[];
}

export interface TokenGateJwt {
  signedToken: string;
  tokenGate: TokenGateWithRoles;
}

export interface TokenGateEvaluationAttempt {
  userId: string;
  authSig: AuthSig;
  spaceIdOrDomain: string;
}

/**
 * @gateTokens List of Lit-generated tokens we can verify when joining a space
 */
export interface TokenGateEvaluationResult {
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
export interface TokenGateVerification {
  userId: string;
  spaceId: string;
  tokens: TokenGateJwt[];
}

export interface TokenGateVerificationResult {
  userId: string;
  space: Space;
  roles: Role[];
}
