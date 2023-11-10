import type { TokenGate as PrismaTokenGate } from '@charmverse/core/prisma';
import type { HumanizedAccsProps } from '@lit-protocol/types';

export type TokenGateJoinType = 'public_bounty_token_gate' | 'token_gate';

type TokenGateFields = Pick<PrismaTokenGate, 'createdAt' | 'id'>;

// TODO: Verify chains is being used by Lit, even tho its not on lit's types
export type TokenGateConditions = HumanizedAccsProps & { chains?: string[] };

export type TokenGate = TokenGateFields & {
  conditions: TokenGateConditions;
  resourceId: any;
};
export type TokenGateWithRoles = TokenGate & {
  tokenGateToRoles: { role: { id: string; name: string } }[];
};

export type TokenGateAccessType =
  | 'individual_wallet'
  | 'individual_nft'
  | 'group_token_or_nft'
  | 'dao_members'
  | 'poap_collectors';
