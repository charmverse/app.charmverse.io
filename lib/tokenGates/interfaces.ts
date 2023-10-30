import type { Role, Space, TokenGate, TokenGateToRole } from '@charmverse/core/prisma';

export type TokenGateJoinType = 'public_bounty_token_gate' | 'token_gate';

export interface TokenGateWithRoles extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & { role: Role })[];
}

export type TokenGateJwtResult = { jwt?: string; id: string; verified: boolean; grantedRoles: string[] };

export interface TokenGateJwt {
  signedToken: string;
  tokenGate: TokenGateWithRoles;
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

export type TokenGateAccessType =
  | 'individual_wallet'
  | 'individual_nft'
  | 'group_token_or_nft'
  | 'dao_members'
  | 'poap_collectors';
