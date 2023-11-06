import type { Role, TokenGate, TokenGateToRole } from '@charmverse/core/prisma';

export type TokenGateJoinType = 'public_bounty_token_gate' | 'token_gate';

export interface TokenGateWithRoles extends TokenGate {
  tokenGateToRoles: (TokenGateToRole & { role: Role })[];
}

export type TokenGateAccessType =
  | 'individual_wallet'
  | 'individual_nft'
  | 'group_token_or_nft'
  | 'dao_members'
  | 'poap_collectors';
