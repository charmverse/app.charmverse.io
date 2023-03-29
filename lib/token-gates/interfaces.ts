import type { JsonAuthSig } from '@lit-protocol/types';
import type { Role, Space, TokenGate, TokenGateToRole } from '@prisma/client';

export type TokenGateJoinType = 'public_bounty_token_gate' | 'token_gate';

export interface TokenGateWithRoles extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & { role: Role })[];
}

export type TokenGateJwtResult = { jwt?: string; id: string; verified: boolean; grantedRoles: string[] };

export interface TokenGateJwt {
  signedToken: string;
  tokenGate: TokenGateWithRoles;
}

export interface TokenGateEvaluationAttempt {
  userId: string;
  authSig: JsonAuthSig;
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
  gateTokens: TokenGateJwt[];
  roles: Role[];
}

/**
 * Used for passing lit JWTs and gaining membership to a space
 * @commit Whether the token gates for selected tokens should be applied
 */
export interface TokenGateVerification {
  userId: string;
  spaceId: string;
  tokens: (Pick<TokenGateJwt, 'signedToken'> & { tokenGateId: string })[];
  commit: boolean;
  joinType?: TokenGateJoinType;
  reevaluate?: boolean;
}

export interface TokenGateVerificationResult {
  userId: string;
  space: Space;
  roles: Role[];
}

export type TokenGateAccessType =
  | 'individual_wallet'
  | 'individual_nft'
  | 'group_token_or_nft'
  | 'dao_members'
  | 'poap_collectors'
  | 'cask_subscribers';
