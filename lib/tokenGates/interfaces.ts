import type { TokenGate as PrismaTokenGate, Role } from '@charmverse/core/prisma';
import type { HumanizedAccsProps } from '@lit-protocol/types';

export type TokenGateJoinType = 'public_bounty_token_gate' | 'token_gate';

type TokenGateFields = Pick<PrismaTokenGate, 'createdAt' | 'id' | 'spaceId'> & {
  resourceId: any;
};

export type Lock = {
  name: string; // lock name
  contract: string; // lock contract address
  chainId: number; // lock chain id
  image?: string; // lock image
  description?: string; // lock description
  balanceOf?: 1 | 0; // the number of valid keys owned by the walletAddress
  expirationTimestamp?: number; // expiration date or 0 if the owner has never owned a key for this lock
};

// TODO: Verify chains is being used by Lit, even tho its not on lit's types
export type LitTokenGateConditions = HumanizedAccsProps & { chains?: string[] };

type UnlockTokenGate = TokenGateFields & { conditions: Lock; type: 'unlock' };

type LitTokenGate = TokenGateFields & { conditions: LitTokenGateConditions; type: 'lit' };

type TokenGateOptions = UnlockTokenGate | LitTokenGate;

export type TokenGate<T extends TokenGateOptions['type'] | undefined = undefined> = T extends undefined
  ? TokenGateOptions
  : Extract<TokenGateOptions, { type: T }>;

type WithRoles = {
  tokenGateToRoles: { role: Pick<Role, 'id' | 'name'> }[];
};

export type TokenGateWithRoles<T extends TokenGateOptions['type'] | undefined = undefined> = TokenGate<T> & WithRoles;

export type TokenGateAccessType =
  | 'individual_wallet'
  | 'individual_nft'
  | 'group_token_or_nft'
  | 'dao_members'
  | 'poap_collectors';
